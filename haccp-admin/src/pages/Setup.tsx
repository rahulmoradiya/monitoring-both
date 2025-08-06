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
import { doc, setDoc, getDoc, updateDoc, getDocs, collectionGroup } from 'firebase/firestore';
import { db, storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

// --- Types ---
interface CompanyDetails {
  country: string;
  name: string;
  businessType: string;
  totalEmployee: string;
  address: string;
  email: string;
  language: string;
  unitSystem: string;
  dateFormat: string;
  timeZone: string;
  logoUrl?: string;
  [key: string]: string | undefined;
}

interface BusinessUnitDetails {
  [key: string]: string;
  unitName: string;
  address: string;
  country: string;
  phone: string;
  email: string;
}

// --- Initial Data ---
const initialCompany: CompanyDetails = {
  country: '',
  name: '',
  businessType: '',
  totalEmployee: '',
  address: '',
  email: '',
  language: '',
  unitSystem: '',
  dateFormat: '',
  timeZone: '',
  logoUrl: '',
};

const initialBusinessUnit: BusinessUnitDetails = {
  unitName: '',
  address: '',
  country: '',
  phone: '',
  email: '',
};

const companyFields = [
  { key: 'country', label: 'Country', required: true },
  { key: 'name', label: 'Company name', required: true },
  { 
    key: 'businessType', 
    label: 'Business type',
    type: 'select',
    options: [
      { value: 'raw_material', label: 'Raw Material Supplier' },
      { value: 'component_manufacturer', label: 'Component Manufacturer' },
      { value: 'finished_goods', label: 'Finished Goods Manufacturer' },
      { value: 'contract_manufacturer', label: 'Contract Manufacturer' },
      { value: 'oem_odm', label: 'OEM / ODM' },
      { value: 'assembler_fabricator', label: 'Assembler / Fabricator' },
      { value: 'packaging_labeling', label: 'Packaging & Labeling' },
      { value: 'quality_inspection', label: 'Quality & Inspection Services' },
      { value: 'distributor', label: 'Distributor / Wholesaler' },
      { value: 'trade', label: 'Exporter / Importer' },
      { value: 'logistics', label: 'Logistics & Warehousing' },
      { value: 'consultancy', label: 'Engineering / Consultancy' },
      { value: 'other', label: 'Other' }
    ]
  },
  { key: 'totalEmployee', label: 'Total Employee' },
  { key: 'address', label: 'Address' },
  { key: 'email', label: 'Email' },
  { 
    key: 'language', 
    label: 'Preferred language',
    type: 'select',
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish (Español)' },
      { value: 'fr', label: 'French (Français)' },
      { value: 'de', label: 'German (Deutsch)' },
      { value: 'it', label: 'Italian (Italiano)' },
      { value: 'pt', label: 'Portuguese (Português)' },
      { value: 'ru', label: 'Russian (Русский)' },
      { value: 'zh', label: 'Chinese (中文)' },
      { value: 'ja', label: 'Japanese (日本語)' },
      { value: 'ko', label: 'Korean (한국어)' },
      { value: 'ar', label: 'Arabic (العربية)' },
      { value: 'hi', label: 'Hindi (हिन्दी)' },
      { value: 'nl', label: 'Dutch (Nederlands)' },
      { value: 'pl', label: 'Polish (Polski)' },
      { value: 'tr', label: 'Turkish (Türkçe)' },
      { value: 'vi', label: 'Vietnamese (Tiếng Việt)' },
      { value: 'th', label: 'Thai (ไทย)' },
      { value: 'id', label: 'Indonesian (Bahasa Indonesia)' },
      { value: 'ms', label: 'Malay (Bahasa Melayu)' },
      { value: 'sv', label: 'Swedish (Svenska)' }
    ]
  },
  { 
    key: 'unitSystem', 
    label: 'Unit System', 
    type: 'select', 
    options: [
      { value: 'si', label: 'SI (Metric System)' },
      { value: 'us', label: 'US Customary System' },
      { value: 'imperial', label: 'Imperial System' }
    ] 
  },
  { 
    key: 'dateFormat', 
    label: 'Date format', 
    type: 'select', 
    options: [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Day/Month/Year)' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Month/Day/Year)' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (European)' },
      { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (US Format)' }
    ] 
  },
  {
    key: 'timeZone',
    label: 'Time Zone',
    type: 'select',
    options: [
      // UTC-12 to UTC+14
      { value: 'UTC-12', label: '(UTC-12:00) Baker Island' },
      { value: 'UTC-11', label: '(UTC-11:00) American Samoa, Niue' },
      { value: 'UTC-10', label: '(UTC-10:00) Hawaii' },
      { value: 'UTC-9', label: '(UTC-09:00) Alaska' },
      { value: 'UTC-8', label: '(UTC-08:00) Pacific Time (US & Canada)' },
      { value: 'UTC-7', label: '(UTC-07:00) Mountain Time (US & Canada)' },
      { value: 'UTC-6', label: '(UTC-06:00) Central Time (US & Canada)' },
      { value: 'UTC-5', label: '(UTC-05:00) Eastern Time (US & Canada)' },
      { value: 'UTC-4', label: '(UTC-04:00) Atlantic Time (Canada)' },
      { value: 'UTC-3', label: '(UTC-03:00) Buenos Aires, Sao Paulo' },
      { value: 'UTC-2', label: '(UTC-02:00) Mid-Atlantic' },
      { value: 'UTC-1', label: '(UTC-01:00) Azores, Cape Verde' },
      { value: 'UTC+0', label: '(UTC+00:00) London, Dublin, Lisbon' },
      { value: 'UTC+1', label: '(UTC+01:00) Berlin, Paris, Rome, Madrid' },
      { value: 'UTC+2', label: '(UTC+02:00) Cairo, Athens, Istanbul' },
      { value: 'UTC+3', label: '(UTC+03:00) Moscow, Baghdad' },
      { value: 'UTC+4', label: '(UTC+04:00) Dubai, Baku' },
      { value: 'UTC+5', label: '(UTC+05:00) Karachi, Tashkent' },
      { value: 'UTC+5.5', label: '(UTC+05:30) Mumbai, Colombo' },
      { value: 'UTC+6', label: '(UTC+06:00) Dhaka, Almaty' },
      { value: 'UTC+7', label: '(UTC+07:00) Bangkok, Jakarta' },
      { value: 'UTC+8', label: '(UTC+08:00) Beijing, Singapore' },
      { value: 'UTC+9', label: '(UTC+09:00) Tokyo, Seoul' },
      { value: 'UTC+9.5', label: '(UTC+09:30) Adelaide, Darwin' },
      { value: 'UTC+10', label: '(UTC+10:00) Sydney, Melbourne' },
      { value: 'UTC+11', label: '(UTC+11:00) Solomon Islands' },
      { value: 'UTC+12', label: '(UTC+12:00) Auckland, Fiji' },
      { value: 'UTC+13', label: '(UTC+13:00) Samoa, Tonga' },
      { value: 'UTC+14', label: '(UTC+14:00) Line Islands' }
    ]
  },
];

const buFields = [
  { key: 'unitName', label: 'Contact Person', required: true },
  { key: 'address', label: 'Address' },
  { key: 'country', label: 'Country' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

export default function Setup() {
  // --- State ---
  const [tab, setTab] = useState(0);
  const [company, setCompany] = useState<CompanyDetails>(initialCompany);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<CompanyDetails>(initialCompany);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [dynamicFields, setDynamicFields] = useState(companyFields.filter(f => !['country','name','businessType','address','email','language','unitSystem','dateFormat','timeZone'].includes(f.key)));

  const [businessUnit, setBusinessUnit] = useState<BusinessUnitDetails>(initialBusinessUnit);
  const [buEditMode, setBuEditMode] = useState(false);
  const [buEditValues, setBuEditValues] = useState<BusinessUnitDetails>(initialBusinessUnit);
  const [dynamicBuFields, setDynamicBuFields] = useState(buFields.filter(f => !['unitName','address','country','phone','email'].includes(f.key)));

  const [userRole, setUserRole] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  // --- Tab Change ---
  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  // --- Fetch Company Code and User Role ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setCompanyCode(userDoc.data().companyCode);
          setUserRole(userDoc.data().role || '');
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // --- Fetch Company Profile ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!companyCode) return;
      const docRef = doc(db, 'companies', companyCode, 'companyProfile', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompany({ ...initialCompany, ...data });
        setEditValues({ ...initialCompany, ...data });
      }
    };
    fetchProfile();
  }, [companyCode]);

  // --- Fetch Business Unit Profile ---
  useEffect(() => {
    const fetchBU = async () => {
      if (!companyCode) return;
      const docRef = doc(db, 'companies', companyCode, 'businessUnits', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusinessUnit({ ...initialBusinessUnit, ...data });
        setBuEditValues({ ...initialBusinessUnit, ...data });
      }
    };
    fetchBU();
  }, [companyCode]);

  // Remove businessType from Firebase when component loads
  useEffect(() => {
    if (companyCode) {
      removeBusinessTypeFromFirebase();
    }
  }, [companyCode]);

  // --- Company Edit Handlers ---
  const handleEdit = () => {
    if (userRole !== 'owner') {
      setAlertOpen(true);
      return;
    }
    setEditValues(company);
    setEditMode(true);
  };
  const handleCancel = () => setEditMode(false);
  const handleFieldChange = (field: string, value: string) => setEditValues(prev => ({ ...prev, [field]: value }));
  const handleSave = async () => {
    setCompany(editValues);
    setEditMode(false);
    try {
      if (!companyCode) return;
      await setDoc(doc(db, 'companies', companyCode, 'companyProfile', 'profile'), editValues);
      alert('Company details saved!');
    } catch (error: any) {
      alert('Error saving company details: ' + error.message);
    }
  };

  // --- Dynamic Company Fields ---
  const handleRemoveField = (key: string) => {
    setDynamicFields(fields => fields.filter(f => f.key !== key));
    setEditValues(prev => { const newValues = { ...prev }; delete newValues[key]; return newValues; });
  };
  const handleAddField = () => {
    const newKey = `custom_${Date.now()}`;
    setDynamicFields(fields => [...fields, { key: newKey, label: 'Custom field' }]);
    setEditValues(prev => ({ ...prev, [newKey]: '' }));
  };
  const handleCustomLabelChange = (key: string, newLabel: string) => {
    setDynamicFields(fields => fields.map(f => f.key === key ? { ...f, label: newLabel } : f));
  };

  // --- Logo Upload ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUploadError(null);
    setLogoUploadLoading(true);
    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!companyCode) return;
        const storageRef = ref(storage, `company-logos/${companyCode}-logo.png`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await setDoc(doc(db, 'companies', companyCode, 'companyProfile', 'profile'), { logoUrl: url }, { merge: true });
        setLogoUploadSuccess(true);
        setEditValues(prev => ({ ...prev, logoUrl: url }));
        setCompany(prev => ({ ...prev, logoUrl: url }));
        alert('Logo uploaded and saved!');
      }
    } catch (error: any) {
      setLogoUploadError(error.message || 'Error uploading logo');
      alert('Error uploading logo: ' + error.message);
    } finally {
      setLogoUploadLoading(false);
    }
  };

  // --- Business Unit Edit Handlers ---
  const handleBuEdit = () => {
    setBuEditValues(businessUnit);
    setBuEditMode(true);
  };
  const handleBuCancel = () => setBuEditMode(false);
  const handleBuFieldChange = (field: string, value: string) => setBuEditValues(prev => ({ ...prev, [field]: value }));
  const handleBuSave = async () => {
    setBusinessUnit(buEditValues);
    setBuEditMode(false);
    try {
      if (!companyCode) return;
      await setDoc(doc(db, 'companies', companyCode, 'businessUnits', 'profile'), buEditValues);
      alert('Business unit details saved!');
    } catch (error: any) {
      alert('Error saving business unit details: ' + error.message);
    }
  };

  // --- Dynamic BU Fields ---
  const handleRemoveBuField = (key: string) => {
    setDynamicBuFields(fields => fields.filter(f => f.key !== key));
    setBuEditValues(prev => { const newValues = { ...prev }; delete newValues[key]; return newValues; });
  };
  const handleAddBuField = () => {
    const newKey = `custom_bu_${Date.now()}`;
    setDynamicBuFields(fields => [...fields, { key: newKey, label: 'Custom field' }]);
    setBuEditValues(prev => ({ ...prev, [newKey]: '' }));
  };
  const handleCustomBuLabelChange = (key: string, newLabel: string) => {
    setDynamicBuFields(fields => fields.map(f => f.key === key ? { ...f, label: newLabel } : f));
  };

  // Function to remove businessType from existing Firebase documents
  const removeBusinessTypeFromFirebase = async () => {
    if (!companyCode) {
      console.error('Company code not available');
      return;
    }

    try {
      // Get the business unit document
      const buDocRef = doc(db, 'companies', companyCode, 'businessUnits', 'profile');
      const buDocSnap = await getDoc(buDocRef);
      
      if (buDocSnap.exists()) {
        const data = buDocSnap.data();
        const { businessType, ...dataWithoutBusinessType } = data;
        
        // Update the document without businessType
        await updateDoc(buDocRef, dataWithoutBusinessType);
        console.log('Successfully removed businessType from Firebase');
      }
    } catch (error) {
      console.error('Error removing businessType from Firebase:', error);
    }
  };

  // --- Render ---
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, pt: 0, mt: 0, maxWidth: 900, mx: { xs: 1, sm: 2, md: 4 }, ml: 0 }}>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 4 }}>
        <Tab label="Company" />
        <Tab label="Contact Person" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700, color: '#222' }}>
            Company
          </Typography>
          <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info" sx={{ mb: 3 }}>
            Review and edit your company information, including measurement systems and units. Add custom fields as needed.
          </Alert>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {!editMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={handleEdit} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box>
              {/* Render non-deletable fields */}
              {companyFields.filter(f => !dynamicFields.find(df => df.key === f.key)).map(({ key, label, required, tooltip, type, options }: any) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{label}{required && ' *'}</Typography>
                    {tooltip && (
                      <Tooltip title={tooltip} placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#888', ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                                      <Box sx={{ flex: 1, minWidth: 180 }}>
                      {editMode ? (
                        type === 'select' ? (
                          <FormControl fullWidth size="small">
                            <Select
                              value={editValues[key] || ''}
                              onChange={e => handleFieldChange(key, e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select {label}</em>
                              </MenuItem>
                              {options?.map((option: any) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            size="small"
                            fullWidth
                            value={editValues[key] || ''}
                            onChange={e => handleFieldChange(key, e.target.value)}
                            required={!!required}
                            placeholder={label}
                          />
                        )
                      ) : (
                        <Typography variant="body1" sx={{ color: company[key] ? '#222' : '#aaa' }}>
                          {type === 'select' && options ? 
                            options.find((opt: any) => opt.value === company[key])?.label || company[key] || <span style={{ color: '#aaa' }}>-</span>
                            : company[key] || <span style={{ color: '#aaa' }}>-</span>
                          }
                        </Typography>
                      )}
                    </Box>
                </Box>
              ))}
              {/* Render dynamic (custom) fields */}
              {dynamicFields.map(({ key, label, tooltip }: any) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    {key.startsWith('custom_') && editMode ? (
                      <TextField
                        size="small"
                        value={label}
                        onChange={e => handleCustomLabelChange(key, e.target.value)}
                        placeholder="Field name"
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{label}</Typography>
                    )}
                    {tooltip && (
                      <Tooltip title={tooltip} placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#888', ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center' }}>
                    {editMode ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editValues[key] || ''}
                        onChange={e => handleFieldChange(key, e.target.value)}
                        placeholder={label}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: company[key] ? '#222' : '#aaa' }}>
                        {company[key] || <span style={{ color: '#aaa' }}>-</span>}
                      </Typography>
                    )}
                    {editMode && (
                      <Tooltip title="Delete field">
                        <IconButton onClick={() => handleRemoveField(key)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
              {/* Company Logo upload row */}
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
                    onChange={handleLogoUpload}
                  />
                  <label htmlFor="company-logo-upload">
                    <IconButton color="primary" component="span" disabled={logoUploadLoading}>
                      <CloudUploadIcon />
                    </IconButton>
                  </label>
                  {logoUploadLoading && (
                    <Typography sx={{ color: '#1976d2', ml: 2, fontWeight: 500 }}>Uploading...</Typography>
                  )}
                  {logoUploadSuccess && !logoUploadLoading && !logoUploadError && (
                    <Typography sx={{ color: 'green', ml: 2, fontWeight: 500 }}>Logo uploaded!</Typography>
                  )}
                  {logoUploadError && (
                    <Typography sx={{ color: 'red', ml: 2, fontWeight: 500 }}>{logoUploadError}</Typography>
                  )}
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt="Company Logo" style={{ height: 40, marginLeft: 16, borderRadius: 4 }} />
                  )}
                </Box>
              </Box>
              {/* Add custom field button */}
              {editMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Tooltip title="Add More">
                    <IconButton color="primary" onClick={handleAddField} sx={{ width: 56, height: 56 }}>
                      <AddIcon sx={{ fontSize: 36 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
              </Box>
            ) : null}
          </Paper>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700, color: '#222' }}>
            Contact Person
          </Typography>
          <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info" sx={{ mb: 3 }}>
            Review and edit your business unit information. Add custom fields as needed.
          </Alert>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box>
              {buFields.filter(f => !dynamicBuFields.find(df => df.key === f.key)).map(({ key, label, required, tooltip }: any) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{label}{required && ' *'}</Typography>
                    {tooltip && (
                      <Tooltip title={tooltip} placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#888', ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    {buEditMode ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={buEditValues[key] || ''}
                        onChange={e => handleBuFieldChange(key, e.target.value)}
                        required={!!required}
                        placeholder={label}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: businessUnit[key] ? '#222' : '#aaa' }}>
                        {businessUnit[key] || <span style={{ color: '#aaa' }}>-</span>}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {dynamicBuFields.map(({ key, label, tooltip }: any) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ width: { xs: '100%', sm: '40%', md: '32%' }, minWidth: 120, pr: 2, display: 'flex', alignItems: 'center' }}>
                    {key.startsWith('custom_bu_') && buEditMode ? (
                      <TextField
                        size="small"
                        value={label}
                        onChange={e => handleCustomBuLabelChange(key, e.target.value)}
                        placeholder="Field name"
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{label}</Typography>
                    )}
                    {tooltip && (
                      <Tooltip title={tooltip} placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#888', ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center' }}>
                    {buEditMode ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={buEditValues[key] || ''}
                        onChange={e => handleBuFieldChange(key, e.target.value)}
                        placeholder={label}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: businessUnit[key] ? '#222' : '#aaa' }}>
                        {businessUnit[key] || <span style={{ color: '#aaa' }}>-</span>}
                      </Typography>
                    )}
                    {buEditMode && (
                      <Tooltip title="Delete field">
                        <IconButton onClick={() => handleRemoveBuField(key)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
              {buEditMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <Tooltip title="Add More">
                    <IconButton color="primary" onClick={handleAddBuField}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {buEditMode ? (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button onClick={handleBuCancel}>Cancel</Button>
                <Button onClick={handleBuSave} variant="contained">Save</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  sx={{ background: '#7be495', color: '#222', fontWeight: 600, '&:hover': { background: '#5fd68b' } }}
                  onClick={handleBuEdit}
                >
                  Edit
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}
      {/* Alert Dialog for non-owners */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>Permission Denied</DialogTitle>
        <DialogContent>
          <Typography>You do not have permission to edit company details. Only the owner can edit this information.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 