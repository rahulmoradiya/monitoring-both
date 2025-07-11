import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// Firebase imports
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, collectionGroup, getDocs } from 'firebase/firestore';

export default function Setup() {
  // UI state
  const [tab, setTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [buEditMode, setBuEditMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Form state
  const [companyData, setCompanyData] = useState<{ [key: string]: string }>({
    country: '',
    name: '',
    regNumber: '',
    vat: '',
    address: '',
    email: '',
    language: '',
    volumeUnits: '',
    weightUnits: '',
    tempUnit: '',
    monitoring: '',
    tempPrefill: '',
    dateFormat: ''
  });
  const [businessUnitData, setBusinessUnitData] = useState<{ [key: string]: string }>({
    unitName: '',
    address: '',
    country: '',
    phone: '',
    email: '',
    workEmail: '',
    representative: '',
    businessType: '',
    locationType: '',
    numEmployees: '',
    language: '',
    timeZone: ''
  });

  // Loading and error state
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [buLoading, setBuLoading] = useState(false);
  const [buError, setBuError] = useState('');

  // Company code
  const [companyCode, setCompanyCode] = useState('');

  // Fetch current user and companyCode
  useEffect(() => {
    const fetchUserCompany = async () => {
      const user = auth.currentUser;
      if (user) {
        // Find user in any users subcollection
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          const userData = userDoc.data();
          setCompanyCode(userData.companyCode || '');
        }
      }
    };
    fetchUserCompany();
  }, []);

  // Fetch company and business unit data
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!companyCode) return;
      const companyDoc = await getDoc(doc(db, 'companies', companyCode));
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        setCompanyData(prev => ({ ...prev, ...data }));
        if (data.businessUnit) setBusinessUnitData(prev => ({ ...prev, ...data.businessUnit }));
      }
    };
    if (companyCode) fetchCompanyDetails();
  }, [companyCode]);

  // Field definitions
  const companyFields = [
    { key: 'country', label: 'Country', required: true },
    { key: 'name', label: 'Company name', required: true },
    { key: 'regNumber', label: 'Company registration number' },
    { key: 'vat', label: 'VAT No.' },
    { key: 'address', label: 'Address' },
    { key: 'email', label: 'Email' },
    { key: 'language', label: 'Preferred language' },
    { key: 'volumeUnits', label: 'System of volume units' },
    { key: 'weightUnits', label: 'System of weight units' },
    { key: 'tempUnit', label: 'Temperature unit' },
    { key: 'monitoring', label: 'Monitoring' },
    { key: 'tempPrefill', label: 'Temperature pre-filling solution' },
    { key: 'dateFormat', label: 'Date format' }
  ];
  const buFields = [
    { key: 'unitName', label: 'Contact Person', required: true },
    { key: 'address', label: 'Address' },
    { key: 'country', label: 'Country' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'workEmail', label: 'Work e-mail for notifications' },
    { key: 'representative', label: 'Representative person' },
    { key: 'businessType', label: 'Business type' },
    { key: 'locationType', label: 'Type of location' },
    { key: 'numEmployees', label: 'Number of employees' },
    { key: 'language', label: 'Preferred language' },
    { key: 'timeZone', label: 'Time zone' }
  ];

  // Handlers for form fields
  const handleCompanyFieldChange = (key: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [key]: value }));
  };
  const handleBuFieldChange = (key: string, value: string) => {
    setBusinessUnitData(prev => ({ ...prev, [key]: value }));
  };

  // Save handlers
  const handleCompanySave = async () => {
    if (!companyCode) return;
    setCompanyLoading(true);
    setCompanyError('');
    try {
      await setDoc(doc(db, 'companies', companyCode), companyData, { merge: true });
      setEditMode(false);
    } catch (err) {
      setCompanyError('Failed to save company data.');
    } finally {
      setCompanyLoading(false);
    }
  };
  const handleBuSave = async () => {
    if (!companyCode) return;
    setBuLoading(true);
    setBuError('');
    try {
      await setDoc(doc(db, 'companies', companyCode), { businessUnit: businessUnitData }, { merge: true });
      setBuEditMode(false);
    } catch (err) {
      setBuError('Failed to save business unit data.');
    } finally {
      setBuLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, pt: 0, mt: 0, maxWidth: 900, mx: { xs: 1, sm: 2, md: 4 }, ml: 0 }}>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 4 }}>
        <Tab label="Company" />
        <Tab label="Business units" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700, color: '#222' }}>
            Company
          </Typography>
          <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info" sx={{ mb: 3, background: '#e3f2fd', color: '#222', border: '1px solid #90caf9' }}>
            <span style={{ color: '#1976d2', fontWeight: 500 }}>
              Welcome! Please set up your company information to get started.
            </span>
          </Alert>
          {companyError && <Alert severity="error">{companyError}</Alert>}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {!editMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={() => setEditMode(true)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box>
              {companyFields.map(({ key, label, required }) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {label}{required && ' *'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    {editMode ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={companyData[key] || ''}
                        onChange={e => handleCompanyFieldChange(key, e.target.value)}
                        placeholder={label}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: companyData[key] ? '#222' : '#aaa' }}>
                        {companyData[key] || <span style={{ color: '#aaa' }}>-</span>}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {/* Company Logo upload row (UI only) */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>LOGO</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="company-logo-upload"
                    type="file"
                  />
                  <label htmlFor="company-logo-upload">
                    <IconButton color="primary" component="span">
                      <CloudUploadIcon />
                    </IconButton>
                  </label>
                </Box>
              </Box>
              {/* Add field button (UI only) */}
              {editMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Tooltip title="Add More">
                    <IconButton color="primary" sx={{ width: 56, height: 56 }}>
                      <AddIcon sx={{ fontSize: 36 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button onClick={() => setEditMode(false)} disabled={companyLoading}>Cancel</Button>
                <Button variant="contained" onClick={handleCompanySave} disabled={companyLoading}>{companyLoading ? 'Saving...' : 'Save'}</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  sx={{ background: '#7be495', color: '#222', fontWeight: 600, '&:hover': { background: '#5fd68b' } }}
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
              </Box>
            )}
          </Paper>
          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete all company details? This action cannot be undone.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
              <Button color="error" variant="contained">Delete</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700, color: '#222' }}>
            Business units
          </Typography>
          <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info" sx={{ mb: 3, background: '#e3f2fd', color: '#222', border: '1px solid #90caf9' }}>
            <span style={{ color: '#1976d2', fontWeight: 500 }}>
              Set up your business unit information. This helps organize your operations and manage multiple locations or departments.
            </span>
          </Alert>
          {buError && <Alert severity="error">{buError}</Alert>}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {!buEditMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={() => setBuEditMode(true)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box>
              {buFields.map(({ key, label, required }) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {label}{required && ' *'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    {buEditMode ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={businessUnitData[key] || ''}
                        onChange={e => handleBuFieldChange(key, e.target.value)}
                        placeholder={label}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: businessUnitData[key] ? '#222' : '#aaa' }}>
                        {businessUnitData[key] || <span style={{ color: '#aaa' }}>-</span>}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {/* Add field button (UI only) */}
              {buEditMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Tooltip title="Add More">
                    <IconButton color="primary">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {buEditMode ? (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button onClick={() => setBuEditMode(false)} disabled={buLoading}>Cancel</Button>
                <Button variant="contained" onClick={handleBuSave} disabled={buLoading}>{buLoading ? 'Saving...' : 'Save'}</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  sx={{ background: '#7be495', color: '#222', fontWeight: 600, '&:hover': { background: '#5fd68b' } }}
                  onClick={() => setBuEditMode(true)}
                >
                  Edit
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
} 