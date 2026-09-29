from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Add role, name, email, created_at to users
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(10) DEFAULT 'USER' NOT NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(128) DEFAULT 'System Admin' NOT NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(128) DEFAULT 'admin@meshsos.local' NOT NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            
            # Add unique constraint for email (may vary by DB dialect, skipping to avoid SQLite vs Postgres issues)
            
            # Add user_id to sos_packets
            conn.execute(text("ALTER TABLE sos_packets ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            
            conn.commit()
            print("Migration successful! Added role, name, email to users and user_id to sos_packets.")
        except Exception as e:
            print(f"Migration error (this is normal if columns already exist): {e}")

if __name__ == "__main__":
    print("Running migration...")
    migrate()
