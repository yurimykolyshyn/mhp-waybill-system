import React, { useState, useEffect } from 'react';
import { WaybillUser } from './types';
import { Backend } from './services/backend';
import LoginPage from './components/LoginPage';
import DriverApp from './components/DriverApp';
import MedicApp from './components/MedicApp';
import ManagerApp from './components/ManagerApp';

const SESSION_KEY = 'mhp_session_user';

Backend.initialize();

export default function App() {
  const [currentUser, setCurrentUser] = useState<WaybillUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: WaybillUser) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-4xl font-black text-red-700">М</span>
          </div>
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.role === 'driver') {
    return <DriverApp user={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'medic') {
    return <MedicApp user={currentUser} onLogout={handleLogout} />;
  }

  return <ManagerApp user={currentUser} onLogout={handleLogout} />;
}
