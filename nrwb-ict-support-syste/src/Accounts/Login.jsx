import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // import db for Firestore
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; // Firestore getDoc
import { FaEnvelope, FaLock } from 'react-icons/fa';

import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('User role not found. Contact admin.');
      }

      const userData = userDocSnap.data();
      const role = userData.role;

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome back, ${user.email}`,
        confirmButtonColor: '#004674'
      }).then(() => {
        if (role === 'ict') {
          navigate('/ict-dashboard');
        } else {
          navigate('/dashboard');
        }
      });

    } catch (err) {
      console.error('Login failed:', err);

      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Invalid email or password. Please try again.',
        confirmButtonColor: '#004674'
      });
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="form-container">
        <div className="form-card">
          <img src="/logo.png" alt="NRWB Logo" className="logo" />
          <h2>Login to NRWB Support</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Sign In</button>
          </form>
          <div className="create-account">
            Don't have an account?{' '}
            <Link to="/register" className="create-account-link">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
