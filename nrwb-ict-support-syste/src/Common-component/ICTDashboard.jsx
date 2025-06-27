import React, { useState, useEffect } from "react";
import './ICTDashboard.css';
import Swal from 'sweetalert2';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
};

const getMonthlyTicketCounts = (tickets) => {
  const counts = {};
  tickets.forEach(({ createdAt }) => {
    const date = toDate(createdAt);
    if (!date) return;
    const monthName = months[date.getMonth()];
    counts[monthName] = (counts[monthName] || 0) + 1;
  });
  return months.map((m) => ({ month: m, total: counts[m] || 0 }));
};

const isWithinLastWeek = (date) => {
  if (!date) return false;
  const now = new Date();
  const diffTime = now - date;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

const ICTDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState({});

  const officers = ["manyeka", "mazy", "agg", "chime"];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "tickets"));
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTickets(fetched);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAssignmentChange = (ticketId, value) => {
    setAssignments(prev => ({ ...prev, [ticketId]: value }));
  };

  const assignTicket = async (ticketId) => {
    const officer = assignments[ticketId];
    if (!officer) return;
    const ref = doc(db, "tickets", ticketId);
    await updateDoc(ref, { assignedTo: officer, status: "assigned" });

    Swal.fire({
      icon: "success",
      title: "Assigned",
      text: `Ticket assigned to ${officer}`,
      confirmButtonColor: "#1976d2"
    });

    fetchTickets();
  };

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === "open").length;
  const resolvedTickets = tickets.filter(t => t.status === "resolved").length;
  const monthlyData = getMonthlyTicketCounts(tickets);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">ICT Dashboard</h2>

      <div className="stats-section">
        <div className="stat-card stat-received">
          <h3>Tickets Received</h3>
          <p>{loading ? "..." : totalTickets}</p>
        </div>
        <div className="stat-card stat-open">
          <h3>Tickets Open</h3>
          <p>{loading ? "..." : openTickets}</p>
        </div>
        <div className="stat-card stat-resolved">
          <h3>Tickets Resolved</h3>
          <p>{loading ? "..." : resolvedTickets}</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Tickets Created by Month</h3>
        {loading ? <p>Loading chart...</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="ticket-table-section">
        <h3>Ticket List</h3>
        {loading ? <p>Loading...</p> : (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Created</th>
                <th>Assigned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(({ id, issue, status, createdAt, assignedTo }) => (
                <tr key={id} className={status === "resolved" ? "resolved" : ""}>
                  <td>{id}</td>
                  <td>{issue}</td>
                  <td style={{ textTransform: "capitalize" }}>{status || "unknown"}</td>
                  <td>{toDate(createdAt)?.toLocaleDateString() || "N/A"}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {assignedTo ? assignedTo : (
                      <select value={assignments[id] || ""} onChange={e => handleAssignmentChange(id, e.target.value)}>
                        <option value="">Assign</option>
                        {officers.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {!assignedTo && assignments[id] && (
                      <button
                        onClick={() => assignTicket(id)}
                        className="assign-btn"
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ICTDashboard;
