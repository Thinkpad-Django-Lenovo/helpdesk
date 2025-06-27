import React, { useEffect, useState } from 'react';
import './History.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { db } from '../firebase'; // adjust path if needed
import { collection, getDocs } from 'firebase/firestore';

// Helper to convert Firestore timestamp
const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
};

const History = () => {
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResolvedTickets = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'tickets'));
        const filtered = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'resolved') {
            filtered.push({ id: doc.id, ...data });
          }
        });
        setResolvedTickets(filtered);
      } catch (error) {
        console.error('Error fetching resolved tickets:', error);
      }
      setLoading(false);
    };

    fetchResolvedTickets();
  }, []);

  return (
    <div className="history-container">
      <h2>Ticket History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : resolvedTickets.length === 0 ? (
        <p>No resolved tickets found.</p>
      ) : (
        <ul className="ticket-list">
          {resolvedTickets.map((ticket, index) => (
            <li key={ticket.id || index} className="ticket-item">
              <div className="ticket-date">
                {toDate(ticket.createdAt)?.toLocaleDateString() || 'N/A'}
              </div>
              <div className="ticket-issue">{ticket.issue || 'No issue provided'}</div>
              <div className="ticket-status resolved">
                <FaCheckCircle className="status-icon" />
                Resolved
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
