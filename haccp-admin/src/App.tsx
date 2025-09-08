import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import AdminLayout from './pages/AdminLayout';
import Overview from './pages/Overview';
import Verification from './pages/Verification';
import Setup from './pages/Setup';
import Teams from './pages/Teams';
import Profile from './pages/Profile';
import Monitoring from './pages/Monitoring';
import Layout from './pages/Layout';
import SOP from './pages/SOP';
import Tasks from './pages/Tasks';
import Departments from './pages/Departments';
import Chat from './pages/Chat';
import ChatDetail from './pages/ChatDetail';


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
        const profileRef = doc(db, 'companies', foundCompanyCode, 'companyProfile', 'profile');
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
        {/* New Home Page Route */}
        <Route path="/" element={!user ? <HomePage /> : <Navigate to="/admin/dashboard" />} />
        
        {/* Legal Pages - Accessible to all users */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={!user ? <LoginPage onLogin={() => setUser(auth.currentUser)} /> : <Navigate to="/admin/dashboard" />} />
        <Route path="/signup" element={!user ? <SignupPage onSignup={() => setUser(auth.currentUser)} /> : <Navigate to="/admin/dashboard" />} />
        
        {/* Existing Admin Routes - All functionality preserved */}
        <Route path="/admin" element={user ? <AdminLayout companyDetails={companyDetails} /> : <Navigate to="/login" /> }>
          <Route path="dashboard" element={<Overview />} />
          <Route path="location" element={<Layout />} />
          <Route path="settings" element={<Setup />} />
          <Route path="teams-management" element={<Teams />} />
          <Route path="files" element={<SOP />} />
          <Route path="manage" element={<Monitoring />} />
          <Route path="manage-tasks" element={<Tasks />} />
          <Route path="audit" element={<Verification />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:chatId" element={<ChatDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="departments" element={<Departments />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
        
        {/* Fallback Route - Preserves existing behavior */}
        <Route path="*" element={<Navigate to={user ? '/admin/dashboard' : '/'} />} />
      </Routes>
    </Router>
  );
}

export default App;
