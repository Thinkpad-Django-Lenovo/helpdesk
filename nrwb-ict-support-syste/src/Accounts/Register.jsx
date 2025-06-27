import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './Register.css';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      Swal.fire({
        icon: 'success',
        title: 'Registered!',
        text: 'Your account has been created successfully.',
        confirmButtonColor: '#004674'
      });

    } catch (error) {
      console.error('Registration failed:', error.message);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'Please try again later.',
        confirmButtonColor: '#004674'
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <img src="/logo.png" alt="NRWB Logo" className="logo" />
        <h2>Register for NRWB Support</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
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
          <div className="input-group">
            {/* No icon here, but follows same styling */}
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="user">User</option>
              <option value="ict">ICT</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
