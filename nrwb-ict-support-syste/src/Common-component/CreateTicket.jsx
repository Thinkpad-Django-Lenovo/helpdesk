import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaClipboard, FaCommentDots } from 'react-icons/fa';
import { db } from '../firebase';  // adjust path as needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './CreateTicket.css';

const CreateTicket = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    department: '',
    issue: '',
    description: ''
  });

  const locations = ['Nkhatabay', 'Mzuzu', 'Rumphi', 'Karonga', 'Mzimba', 'Chitipa'];

  const departments = [
    'Finance Department',
    'Human Resources (HR) Department',
    'Customer Service Department',
    'Technical Services Department',
    'Operations and Maintenance Department',
    'Planning and Development Department',
    'Water Quality and Laboratory Services Department',
    'Commercial Services Department',
    'Procurement and Stores Department',
    'Internal Audit Department',
    'Information and Communication Technology (ICT) Department',
    'Legal and Compliance Department',
    'Public Relations and Communications Department',
    'Transport and Logistics Department',
    'Security Services Department',
    'Metering and Billing Department',
    'Board Secretariat or Corporate Affairs Department'
  ];

  const issues = [
    'System downtime or server outages',
    'Slow or unstable internet connection',
    'Errors in billing or customer management system',
    'ERP modules not functioning properly',
    'Failure of water meter reading sync tools',
    'Mobile app or field tools crashing',
    'Incompatibility between field devices and main systems',
    'No access to system for new staff',
    'Forgotten passwords or locked accounts',
    'Insufficient training on new software',
    'Printer and scanner malfunctions',
    'Computer or laptop breakdowns',
    'Incorrect or delayed reports',
    'Loss of local data with no backup',
    'System modules not integrating properly'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Add a new document with a generated ID
      await addDoc(collection(db, 'tickets'), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      Swal.fire({
        icon: 'success',
        title: 'Ticket Submitted!',
        text: 'Your issue has been reported to ICT.',
        confirmButtonColor: '#004674'
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        location: '',
        department: '',
        issue: '',
        description: ''
      });
    } catch (error) {
      console.error('Error adding ticket:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Please check your input or try again.',
        confirmButtonColor: '#004674'
      });
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>Create Support Ticket</h2>
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
            <FaMapMarkerAlt className="input-icon" />
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            >
              <option value="">Select Location</option>
              {locations.map((loc, index) => (
                <option key={index} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <FaClipboard className="input-icon" />
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <FaClipboard className="input-icon" />
            <select
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              required
            >
              <option value="">Select Issue</option>
              {issues.map((iss, index) => (
                <option key={index} value={iss}>{iss}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <FaCommentDots className="input-icon" />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary">Submit Ticket</button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
