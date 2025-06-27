import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './TicketsList.css';

const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const ticketsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleMarkResolved = async (ticketId) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { status: 'Resolved' });
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const handleDelete = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        await deleteDoc(ticketRef);
        fetchTickets();
      } catch (err) {
        console.error('Error deleting ticket:', err);
      }
    }
  };

  if (loading) return <p className="loading-text">Loading tickets...</p>;
  if (tickets.length === 0) return <p className="loading-text">No tickets found.</p>;

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2>Tickets List</h2>
        <div className="task-count">Total Tasks: <strong>{tickets.length}</strong></div>
      </div>

      <table className="tickets-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Location</th>
            <th>Department</th>
            <th>Issue</th>
            <th>Description</th>
            <th>Status</th>
            <th>Ticket ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>{ticket.name}</td>
              <td>{ticket.email}</td>
              <td>{ticket.location}</td>
              <td>{ticket.department}</td>
              <td>{ticket.issue}</td>
              <td>{ticket.description}</td>
              <td>
                <span className={`status-badge status-${(ticket.status || 'pending').toLowerCase()}`}>
                  {ticket.status || 'Pending'}
                </span>
              </td>
              <td><code>{ticket.id}</code></td>
              <td>
                {ticket.status !== 'Resolved' && (
                  <button onClick={() => handleMarkResolved(ticket.id)} className="btn-action btn-resolve">
                    Mark Resolved
                  </button>
                )}
                <button onClick={() => handleDelete(ticket.id)} className="btn-action btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketsList;
