import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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
import Departments from './pages/Departments';

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
      if (!user) {
        setCompanyDetails(null);
        return;
      }
      // Fetch user document to get companyCode
      const usersSnap = await getDocs(collection(db, 'companies'));
      let foundUserDoc = null;
      let foundCompanyCode = null;
      for (const companyDoc of usersSnap.docs) {
        const usersCol = await getDocs(collection(db, 'companies', companyDoc.id, 'users'));
        const userDoc = usersCol.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          foundUserDoc = userDoc;
          foundCompanyCode = companyDoc.id;
          break;
        }
      }
      if (foundCompanyCode) {
        const profileRef = doc(db, 'companies', foundCompanyCode, 'profile', 'profile');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setCompanyDetails(profileSnap.data());
        } else {
          setCompanyDetails(null);
        }
      } else {
        setCompanyDetails(null);
      }
    };
    if (user) {
      fetchCompanyDetails();
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={() => setUser(auth.currentUser)} /> : <Navigate to="/admin/overview" />} />
        <Route path="/admin" element={user ? <AdminLayout companyDetails={companyDetails} /> : <Navigate to="/login" /> }>
          <Route path="overview" element={<Overview />} />
          <Route path="setup" element={<Setup user={user} companyDetails={companyDetails} businessUnitDetails={businessUnitDetails} />} />
          <Route path="teams" element={<Teams />} />
          <Route path="profile" element={<Profile />} />
          <Route path="monitoring-plan" element={<Monitoring />} />
          <Route path="layout" element={<Layout />} />
          <Route path="sop" element={<SOP />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="departments" element={<Departments />} />
          <Route index element={<Navigate to="overview" />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/admin/overview' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
