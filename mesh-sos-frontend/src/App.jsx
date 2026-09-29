import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { Sidebar, TopBar } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import SosList from './pages/SosList';
import CreateSos from './pages/CreateSos';
import SosDetails from './pages/SosDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

import './App.css';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Router>
        <div className="app-layout">
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          
          <div className="main-wrapper">
            <TopBar setMobileOpen={setMobileOpen} />
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sos-list" element={<SosList />} />
                <Route path="/create" element={<CreateSos />} />
                <Route path="/sos/:id" element={<SosDetails />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </>
  );
}

export default App;
