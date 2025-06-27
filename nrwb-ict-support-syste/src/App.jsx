import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './Accounts/Login';
import Register from './Accounts/Register';
import Dashboard from './Common-component/Dashboard';
import CreateTicket from './Common-component/CreateTicket';
import History from './Common-component/History';
import ICTDashboard from './Common-component/ICTDashboard';
import Sidebar from './Common-component/Sidebar'; // ✅ ADD BACK SIDEBAR
import Navbar from './Common-component/Navbar';
import Home from './Common-component/Home';
import TicketsList from './Common-component/TicketsList';
import { useAuth } from './context/AuthContext';
import './App.css';

const App = () => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const hideSidebarRoutes = ['/', '/login', '/register'];
  const isSidebarVisible = user && !hideSidebarRoutes.includes(location.pathname);
  const isCenteredRoute = hideSidebarRoutes.includes(location.pathname);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

 return (
  <>
    <Navbar />

    {isCenteredRoute ? (
      // 🔹 Clean layout for home/login/register (no sidebar interference)
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    ) : (
      // 🔹 Standard layout for authenticated users
      <div className="app-layout">
        {isSidebarVisible && <Sidebar role={role} />}
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ticket/create" element={<CreateTicket />} />
            <Route path="/history" element={<History />} />
            <Route path="/ict-dashboard" element={<ICTDashboard />} />
            <Route path="/manage-tickets" element={<TicketsList />} />
          </Routes>
        </div>
      </div>
    )}
  </>
);
}
export default App;
