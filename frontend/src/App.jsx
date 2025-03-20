import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RealtorDashboard from './components/Realtor/Dashboard'; // Dashboard page
import RealtorListings from './components/Realtor/Listings'; // Listings page
import RealtorClients from './components/Realtor/Clients'; // Clients page
import RealtorAppointments from './components/Realtor/Appointments'; // Appointments page
import RealtorSettings from './components/Realtor/Settings'; // Settings page
import PropertyListings from './components/PropertyListings'; // Property Listings page
import PropertyDetails from './components/PropertyDetails'; // Property Details page
import UserSettings from './components/UserSettings'; // User Settings page
import Layout from './components/Realtor/Layout'; // Layout component with sidebar

import { ThemeProvider  } from './components/Realtor/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>

    
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/property-listings" element={<PropertyListings />} />
        <Route path="/property-details/:id" element={<PropertyDetails />} />
        <Route path="/user-settings" element={<UserSettings />} />
        
        {/* Realtor Portal Routes */}
        <Route element={<Layout />}> {/* Layout with sidebar */}
          <Route path="/realtor-dashboard" element={<RealtorDashboard />} />
          <Route path="/realtor-portal/listings" element={<RealtorListings />} />
          <Route path="/realtor-portal/clients" element={<RealtorClients />} />
          <Route path="/realtor-portal/appointments" element={<RealtorAppointments />} />
          <Route path="/realtor-portal/settings" element={<RealtorSettings />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
};

export default App;
