import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/AdminLayout';
import Overview from './pages/Overview';
import Setup from './pages/Setup';
import Teams from './pages/Teams';
import Profile from './pages/Profile';
import Monitoring from './pages/Monitoring';
import Layout from './pages/Layout';
import SOP from './pages/SOP';
import Tasks from './pages/Tasks';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [businessUnitDetails, setBusinessUnitDetails] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      const docRef = doc(db, 'company', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCompanyDetails(docSnap.data());
      } else {
        setCompanyDetails(null);
      }
    };
    const fetchBusinessUnitDetails = async () => {
      const docRef = doc(db, 'businessUnits', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusinessUnitDetails(docSnap.data());
      } else {
        setBusinessUnitDetails(null);
      }
    };
    if (user) {
      fetchCompanyDetails();
      fetchBusinessUnitDetails();
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={() => setUser(auth.currentUser)} /> : <Navigate to="/admin/overview" />} />
        <Route path="/admin" element={user ? <AdminLayout companyDetails={companyDetails} /> : <Navigate to="/login" /> }>
          <Route path="overview" element={<Overview />} />
          <Route path="setup" element={<Setup />} />
          <Route path="teams" element={<Teams />} />
          <Route path="profile" element={<Profile />} />
          <Route path="monitoring-plan" element={<Monitoring />} />
          <Route path="sop" element={<SOP />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="layout" element={<Layout />} />
          <Route index element={<Navigate to="overview" />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/admin/overview' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
