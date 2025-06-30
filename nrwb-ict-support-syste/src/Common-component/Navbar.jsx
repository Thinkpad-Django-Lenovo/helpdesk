// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './Navbar.css';

const Navbar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <img src="/logo.png" alt="NRWB Logo" className="navbar-logo" />
        <span className="navbar-title">NRWB ICT HELPDESK</span>
      </div>

      <nav className="navbar-links">
        <Link to="/">Home</Link>

        {!user && (
          <>
            <Link to="/register">Sign Up</Link>
            <Link to="/login">Sign In</Link>
          </>
        )}

       
      </nav>
    </header>
  );
};

export default Navbar;
