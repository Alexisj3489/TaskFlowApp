import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import TaskList from './components/TaskList';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 TaskFlow</h1>
        <p>Tu gestor de tareas seguro y en la nube</p>
        {isAuthenticated && (
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        )}
      </header>

      <main className="app-main">
        {isAuthenticated ? (
          <TaskList />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 TaskFlow - Proyecto Final DevOps</p>
      </footer>
    </div>
  );
}

export default App;
