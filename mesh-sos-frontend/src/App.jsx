import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { Sidebar, TopBar } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import SosList from './pages/SosList';
import CreateSos from './pages/CreateSos';
import SosDetails from './pages/SosDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

import './App.css';

function ProtectedRoute({ children, requireAdmin }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <Toaster theme="dark" position="bottom-right" richColors />
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          
          <div className="main-wrapper">
            <TopBar setMobileOpen={setMobileOpen} />
            
            <main className="main-content">
              <Routes>
                {/* User & Admin Routes */}
                <Route path="/" element={isAdmin ? <Dashboard /> : <Dashboard isUserDashboard />} />
                <Route path="/create" element={<CreateSos />} />
                <Route path="/sos/:id" element={<SosDetails />} />
                
                {/* Admin Only Routes */}
                {isAdmin && <Route path="/sos-list" element={<SosList />} />}
                {isAdmin && <Route path="/analytics" element={<Analytics />} />}
                {isAdmin && <Route path="/settings" element={<Settings />} />}
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
