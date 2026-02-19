import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-500/30">
      {currentPage === 'landing' ? (
        <LandingPage onStart={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard onBack={() => setCurrentPage('landing')} />
      )}
    </div>
  );
}

export default App;
