import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { login, error, isLoading, clearError } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setFormError('');
    clearError();
    
    // Basic validation
    if (!email || !password) {
      setFormError('Please provide both email and password');
      return;
    }
    
    try {
      // Call the login function from context
      await login({ email, password });
    } catch (err) {
      // The error is already set in the context
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Log In</h1>
        
        {(error || formError) && (
          <div className="error-message">
            {error || formError}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-block"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
        
        <div className="auth-message">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
