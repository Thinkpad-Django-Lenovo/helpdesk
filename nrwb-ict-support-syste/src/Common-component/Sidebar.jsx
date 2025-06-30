import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Sidebar = () => {
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
    <div className="sidebar">
      <h2>NRWB ICT HELPDESK</h2>
      <nav>
        {/* Links for regular users */}
        {role === 'user' && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/ticket/create">Create Ticket</Link>
            <Link to="/responses">ICT Responses</Link>
            <Link to="/history">Ticket History</Link>
          </>
        )}

        {/* Links for ICT role */}
        {role === 'ict' && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/manage-tickets">Get Tickets</Link>
            <Link to="/assign">Assign Tasks</Link>
            <Link to="/history">Ticket History</Link>
          </>
        )}

        {/* Links for non-authenticated users */}
        {!user && (
          <>
            <Link to="/">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        {/* Logout button for authenticated users */}
        {user && (
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
