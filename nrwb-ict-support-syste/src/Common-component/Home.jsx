import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Background Video */}
      <video autoPlay muted loop className="background-video">
        <source src="/Background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay for contrast */}
      <div className="video-overlay"></div>

      {/* Foreground Content */}
      <div className="center-content">
        <img src="/logo.png" alt="NRWB Logo" className="home-logo" />
        <h1 className="hero-title">Welcome to NRWB ICT HELPDESK</h1>
        <p className="hero-subtitle">
          Efficient. Reliable. Secure ICT Helpdesk for the Northern Region Water Board.
        </p>

        <div className="cta-buttons">
          <Link to="/login" className="btn-primary">Login</Link>
          <Link to="/register" className="btn-secondary">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
