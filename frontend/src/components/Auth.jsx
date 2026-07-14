import React, { useState } from 'react';
import { authAPI } from '../api';
import './Auth.css';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login(email, password);
      } else {
        response = await authAPI.register(email, password);
      }

      localStorage.setItem('access_token', response.data.access_token);
      onAuthSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Error en la autenticación. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Iniciar sesión' : 'Registrarse'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? 'Procesando...'
              : isLogin
              ? 'Iniciar sesión'
              : 'Registrarse'}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="toggle-btn"
          >
            {isLogin ? 'Registrate aquí' : 'Inicia sesión aquí'}
          </button>
        </p>
      </div>

      <div className="auth-info">
        <h3>Bienvenido a TaskFlow</h3>
        <ul>
          <li>✅ Crea y gestiona tus tareas</li>
          <li>✅ Acceso seguro con autenticación JWT</li>
          <li>✅ Sincronización en tiempo real</li>
          <li>✅ Almacenamiento en la nube</li>
        </ul>
      </div>
    </div>
  );
}

export default Auth;
