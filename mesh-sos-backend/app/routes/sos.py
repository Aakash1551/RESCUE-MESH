"""
SOS packet API routes - Simple, clean implementation
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db
from ..models import (
    SosPacketDB, 
    SosPacketCreate, 
    SosPacketResponse, 
    UploadResponse,
    ActiveSosResponse,
    MarkRespondedRequest,
    DeliveryStatus,
    EmergencyType,
    UserDB,
    UserRole
)
from .auth import get_current_active_user, get_current_active_admin

router = APIRouter(prefix="/api/v1", tags=["SOS"])


@router.post("/upload-sos", response_model=UploadResponse)
async def upload_sos(
    packet: SosPacketCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user)
):
    """Upload an SOS packet from a mesh node."""
    sos_id_str = str(packet.sos_id)
    
    # Check if packet already exists (deduplication)
    existing = db.query(SosPacketDB).filter(SosPacketDB.sos_id == sos_id_str).first()
    
    if existing:
        return UploadResponse(
            success=True,
            sos_id=packet.sos_id,
            message="SOS packet already exists"
        )
    
    # Create new packet record
    db_packet = SosPacketDB(
        sos_id=sos_id_str,
        device_id=packet.device_id,
        timestamp=packet.timestamp,
        latitude=packet.latitude,
        longitude=packet.longitude,
        accuracy=packet.accuracy,
        emergency_type=packet.emergency_type,
        optional_message=packet.optional_message,
        battery_percentage=packet.battery_percentage,
        hop_count=packet.hop_count,
        ttl=packet.ttl,
        signature=packet.signature,
        status=DeliveryStatus.PENDING,
        received_at=datetime.utcnow(),
        user_id=current_user.id
    )
    
    db.add(db_packet)
    db.commit()
    db.refresh(db_packet)
    
    return UploadResponse(
        success=True,
        sos_id=packet.sos_id,
        message="SOS packet uploaded successfully"
    )


@router.get("/active-sos", response_model=ActiveSosResponse)
async def get_active_sos(
    db: Session = Depends(get_db),
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(100, ge=1, le=5000),
    current_user: UserDB = Depends(get_current_active_admin)
):
    """Get all active (non-responded) SOS packets."""
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    packets = db.query(SosPacketDB).filter(
        and_(
            SosPacketDB.status != DeliveryStatus.RESPONDED,
            SosPacketDB.received_at >= time_threshold
        )
    ).order_by(SosPacketDB.timestamp.desc()).limit(limit).all()
    
    response_packets = [SosPacketResponse.model_validate(p) for p in packets]
    
    return ActiveSosResponse(
        count=len(response_packets),
        sos_packets=response_packets
    )

@router.get("/all-sos", response_model=ActiveSosResponse)
async def get_all_sos(
    db: Session = Depends(get_db),
    hours: int = Query(168, ge=1, le=720),
    limit: int = Query(1000, ge=1, le=5000),
    current_user: UserDB = Depends(get_current_active_admin)
):
    """Get ALL SOS packets (including responded) for analytics/history."""
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    packets = db.query(SosPacketDB).filter(
        SosPacketDB.received_at >= time_threshold
    ).order_by(SosPacketDB.timestamp.desc()).limit(limit).all()
    
    response_packets = [SosPacketResponse.model_validate(p) for p in packets]
    
    return ActiveSosResponse(
        count=len(response_packets),
        sos_packets=response_packets
    )



@router.post("/mark-responded", response_model=UploadResponse)
async def mark_responded(
    request: MarkRespondedRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_admin)
):
    """Mark an SOS packet as responded."""
    sos_id_str = str(request.sos_id)
    packet = db.query(SosPacketDB).filter(SosPacketDB.sos_id == sos_id_str).first()
    
    if not packet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SOS packet {request.sos_id} not found"
        )
    
    if packet.status == DeliveryStatus.RESPONDED:
        return UploadResponse(
            success=True,
            sos_id=request.sos_id,
            message="Already marked as responded"
        )
    
    packet.status = DeliveryStatus.RESPONDED
    packet.responded_at = datetime.utcnow()
    packet.responder_id = request.responder_id
    
    db.commit()
    
    return UploadResponse(
        success=True,
        sos_id=request.sos_id,
        message="SOS marked as responded"
    )


@router.get("/sos/{sos_id}", response_model=SosPacketResponse)
async def get_sos_by_id(
    sos_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user)
):
    """Get a specific SOS packet by ID."""
    sos_id_str = str(sos_id)
    packet = db.query(SosPacketDB).filter(SosPacketDB.sos_id == sos_id_str).first()
    
    if not packet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SOS packet {sos_id} not found"
        )
        
    if current_user.role != UserRole.ADMIN and packet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this SOS record"
        )
    
    return SosPacketResponse.model_validate(packet)

@router.get("/my-sos", response_model=ActiveSosResponse)
async def get_my_sos(
    db: Session = Depends(get_db),
    hours: int = Query(720, ge=1, le=8760),
    limit: int = Query(1000, ge=1, le=5000),
    current_user: UserDB = Depends(get_current_active_user)
):
    """Get SOS packets created by the current user."""
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    packets = db.query(SosPacketDB).filter(
        and_(
            SosPacketDB.user_id == current_user.id,
            SosPacketDB.received_at >= time_threshold
        )
    ).order_by(SosPacketDB.timestamp.desc()).limit(limit).all()
    
    response_packets = [SosPacketResponse.model_validate(p) for p in packets]
    
    return ActiveSosResponse(
        count=len(response_packets),
        sos_packets=response_packets
    )
