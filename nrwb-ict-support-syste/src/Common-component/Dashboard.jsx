import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";  // adjust path

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Helper: convert Firestore timestamp to JS Date safely
const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
};

// Aggregate tickets count by month name (e.g. "Jan")
const getMonthlyTicketCounts = (tickets) => {
  const counts = {};

  tickets.forEach(({ createdAt }) => {
    const date = toDate(createdAt);
    if (!date) return;
    const monthName = months[date.getMonth()];
    counts[monthName] = (counts[monthName] || 0) + 1;
  });

  return months.map((m) => ({
    month: m,
    total: counts[m] || 0,
  }));
};

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "tickets"));
        const fetchedTickets = [];
        querySnapshot.forEach((doc) => {
          fetchedTickets.push({ id: doc.id, ...doc.data() });
        });
        setTickets(fetchedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
      setLoading(false);
    };

    fetchTickets();
  }, []);

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
  const monthlyData = getMonthlyTicketCounts(tickets);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "auto" }}>
      <h2>User Dashboard</h2>

      {/* Summary */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: 20, backgroundColor: "#e3f2fd", borderRadius: 8, textAlign: "center" }}>
          <h3>Total Tickets Created</h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{loading ? "Loading..." : totalTickets}</p>
        </div>
        <div style={{ flex: 1, padding: 20, backgroundColor: "#c8e6c9", borderRadius: 8, textAlign: "center" }}>
          <h3>Total Tickets Resolved</h3>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{loading ? "Loading..." : resolvedTickets}</p>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            style={{
              padding: "15px 30px",
              fontSize: 18,
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
            onClick={() => navigate("/ticket/create")}
          >
            Create Ticket
          </button>
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ width: "100%", height: 300, marginBottom: 30 }}>
        <h3>Tickets Created by Month</h3>
        {loading ? (
          <p>Loading chart...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
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

      {/* Tickets Table */}
      <div>
        <h3>Ticket List</h3>
        {loading ? (
          <p>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}
          >
            <thead style={{ backgroundColor: "#1976d2", color: "white" }}>
              <tr>
                <th style={{ padding: 10, border: "1px solid #ddd" }}>ID</th>
                <th style={{ padding: 10, border: "1px solid #ddd" }}>Title</th>
                <th style={{ padding: 10, border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: 10, border: "1px solid #ddd" }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(({ id, issue, status, createdAt }) => (
                <tr key={id} style={{ backgroundColor: status === "resolved" ? "#e8f5e9" : "white" }}>
                  <td style={{ padding: 10, border: "1px solid #ddd", textAlign: "center" }}>{id}</td>
                  <td style={{ padding: 10, border: "1px solid #ddd" }}>{issue || "No title"}</td>
                  <td style={{ padding: 10, border: "1px solid #ddd", textTransform: "capitalize" }}>{status || "unknown"}</td>
                  <td style={{ padding: 10, border: "1px solid #ddd" }}>
                    {toDate(createdAt) ? toDate(createdAt).toLocaleDateString() : "N/A"}
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

export default Dashboard;
