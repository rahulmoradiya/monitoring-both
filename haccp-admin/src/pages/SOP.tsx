import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Select, MenuItem, InputLabel, FormControl, Chip, Checkbox, Avatar, Card, CardContent, CardHeader, Fade, Stack, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, CloudUpload, Download, Search, Description, FolderOpen, Business, Settings } from '@mui/icons-material';
import { db, storage, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';

interface SOP {
  id: string;
  title: string;
  version?: string;
  description: string;
  department: string;
  fileUrl?: string;
  fileName?: string;
  assignedRoles: string[];
  assignedUsers: string[];
  createdAt: any;
}

interface Department {
  id: string;
  name: string;
}

export default function SOP() {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSOP, setCurrentSOP] = useState<Partial<SOP>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<{ uid: string; name: string }[]>([]);
  const [companyCode, setCompanyCode] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterVersion, setFilterVersion] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sopToDelete, setSopToDelete] = useState<{ id: string, fileUrl?: string } | null>(null);

  useEffect(() => {
    // Fetch companyCode, roles, users
    const fetchMeta = async () => {
      try {
        const user = auth.currentUser;
        console.log('Current user:', user);
        if (user) {
          const usersSnap = await getDocs(collectionGroup(db, 'users'));
          console.log('Users found:', usersSnap.docs.length);
          const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
          console.log('User doc found:', userDoc);
          if (userDoc) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            setCompanyCode(userData.companyCode);
            console.log('Company code set:', userData.companyCode);
            // Fetch roles
            const rolesSnap = await getDocs(collection(db, 'companies', userData.companyCode, 'roles'));
            setRoles(rolesSnap.docs.map(doc => doc.data().name));
            // Fetch users
            const companyUsers = usersSnap.docs.filter(doc => doc.data().companyCode === userData.companyCode);
            setUsers(companyUsers.map(doc => ({ uid: doc.data().uid, name: doc.data().name || doc.data().email })));
          }
        }
      } catch (error) {
        console.error('Error fetching meta data:', error);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!companyCode) return;
    const fetchSOPs = async () => {
      const sopsSnap = await getDocs(collection(db, 'companies', companyCode, 'sops'));
      setSOPs(sopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOP)));
    };
    fetchSOPs();
  }, [companyCode]);

  // Fetch departments from Firestore
  useEffect(() => {
    if (!companyCode) return;
    const fetchDepartments = async () => {
      const deptSnap = await getDocs(collection(db, 'companies', companyCode, 'departments'));
      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
    };
    fetchDepartments();
  }, [companyCode]);

  const handleOpenDialog = (sop?: SOP) => {
    console.log('Opening dialog with SOP:', sop);
    setEditMode(!!sop);
    setCurrentSOP(sop ? { ...sop } : { assignedRoles: [], assignedUsers: [], version: '' });
    setFile(null);
    setDialogOpen(true);
    console.log('Dialog should be open now');
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentSOP({});
    setFile(null);
    setEditMode(false);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  const handleSave = async () => {
    console.log('HandleSave called with:', { companyCode, currentSOP });
    if (!companyCode || !currentSOP.title) {
      console.log('Missing required data:', { companyCode, title: currentSOP.title });
      setSnackbarMsg('Missing required data. Please check your connection.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setUploading(false);
      return;
    }
    setUploading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Save operation timed out');
      setSnackbarMsg('Save operation timed out. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setUploading(false);
    }, 30000); // 30 second timeout
    
    let fileUrl = currentSOP.fileUrl;
    let fileName = currentSOP.fileName;
    try {
      console.log('Starting file upload...');
      if (file) {
        try {
          // Upload file to storage
          const storageRef = ref(storage, `companies/${companyCode}/sops/${file.name}`);
          console.log('Uploading to storage ref:', storageRef);
          await uploadBytes(storageRef, file);
          fileUrl = await getDownloadURL(storageRef);
          fileName = file.name;
          console.log('File uploaded successfully:', { fileUrl, fileName });
        } catch (uploadErr) {
          console.error('File upload failed, proceeding without file:', uploadErr);
          // Let save proceed without a file to avoid blocking
          setSnackbarMsg('File upload failed (CORS/permissions). Saved SOP without file.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
      }
      
      const sopData = {
        title: currentSOP.title || '',
        version: currentSOP.version || '',
        description: currentSOP.description || '',
        department: currentSOP.department || '',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        assignedRoles: currentSOP.assignedRoles || [],
        assignedUsers: currentSOP.assignedUsers || [],
        createdAt: currentSOP.createdAt || new Date(),
      };
      
      console.log('SOP data to save:', sopData);
      
      if (editMode && currentSOP.id) {
        console.log('Updating existing SOP...');
        // Find the original SOP
        const originalSOP = sops.find(s => s.id === currentSOP.id);
        if (originalSOP && originalSOP.version !== currentSOP.version) {
          // Version changed: create a new SOP document
          const docRef = await addDoc(collection(db, 'companies', companyCode, 'sops'), sopData);
          console.log('New SOP version created with ID:', docRef.id);
          setSOPs(prev => [
            ...prev,
            { ...sopData, id: docRef.id }
          ]);
          setSnackbarMsg('New SOP version added successfully!');
        } else {
          // Version unchanged: update existing SOP
          await updateDoc(doc(db, 'companies', companyCode, 'sops', currentSOP.id), sopData);
          console.log('SOP updated successfully');
          setSOPs(prev => prev.map(s => s.id === currentSOP.id ? { ...s, ...sopData } as SOP : s));
          setSnackbarMsg('SOP updated successfully!');
        }
      } else {
        console.log('Creating new SOP...');
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'sops'), sopData);
        console.log('New SOP created with ID:', docRef.id);
        setSOPs(prev => [
          ...prev,
          { ...sopData, id: docRef.id }
        ]);
        setSnackbarMsg('SOP added successfully!');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving SOP:', err);
      const message = err instanceof Error ? err.message : String(err);
      setSnackbarMsg(`Failed to save SOP: ${message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
    }
  };
  const handleDeleteClick = (id: string, fileUrl?: string) => {
    setSopToDelete({ id, fileUrl });
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!sopToDelete || !companyCode) {
      console.log('Missing data for delete:', { sopToDelete, companyCode });
      setSnackbarMsg('Missing data for delete operation.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setDeleteDialogOpen(false);
    try {
      console.log('Deleting SOP:', sopToDelete.id);
      await deleteDoc(doc(db, 'companies', companyCode, 'sops', sopToDelete.id));
      setSOPs(prev => prev.filter(s => s.id !== sopToDelete.id));
      if (sopToDelete.fileUrl) {
        const fileRef = ref(storage, sopToDelete.fileUrl);
        await deleteObject(fileRef);
        console.log('File deleted from storage');
      }
      setSnackbarMsg('SOP deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting SOP:', err);
      const message = err instanceof Error ? err.message : String(err);
      setSnackbarMsg(`Failed to delete SOP: ${message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSopToDelete(null);
    }
  };
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSopToDelete(null);
  };
  // Get unique versions from SOPs
  const uniqueVersions = Array.from(new Set(sops.map(sop => sop.version).filter(Boolean)));
  // Filter and search
  const filteredSOPs = sops.filter(sop =>
    (!filterDepartment || sop.department === filterDepartment) &&
    (!filterVersion || sop.version === filterVersion) &&
    (!search || sop.title.toLowerCase().includes(search.toLowerCase()) || (sop.description && sop.description.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Modern Header with Glass Morphism */}
      <Fade in timeout={600}>
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 3,
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Description sx={{ 
                fontSize: 48, 
                color: 'white', 
                mr: 2,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} />
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: 700, 
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Files & SOPs
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Manage your Standard Operating Procedures and documentation
            </Typography>
          </Box>
        </Card>
      </Fade>

      {/* Debug Info */}
      <Fade in timeout={400}>
        <Card sx={{ 
          mb: 2, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Debug: Company Code: {companyCode || 'Not loaded'}, SOPs: {sops.length}, Dialog Open: {dialogOpen.toString()}
            </Typography>
          </CardContent>
        </Card>
      </Fade>

      {/* Modern Action Buttons */}
      <Fade in timeout={800}>
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FolderOpen sx={{ color: '#667eea', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Standard Operating Procedures (SOPs)
                </Typography>
                <Chip 
                  label={`${filteredSOPs.length} ${filteredSOPs.length === 1 ? 'SOP' : 'SOPs'}`}
                  sx={{ 
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* <Button 
                  variant="outlined" 
                  startIcon={<Business />}
                  onClick={() => window.location.href='/admin/teams'}
                  sx={{
                    borderColor: '#2196F3',
                    color: '#2196F3',
                    '&:hover': {
                      borderColor: '#1976D2',
                      background: 'rgba(33, 150, 243, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Manage Departments
                </Button> */}
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={() => handleOpenDialog()}
                  sx={{
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add SOP
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
      {/* Modern Filter Section */}
      <Fade in timeout={1000}>
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Filters & Search
                </Typography>
              </Box>
            }
            sx={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
              borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          />
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel sx={{ color: '#667eea', fontWeight: 500 }}>Department</InputLabel>
                <Select 
                  value={filterDepartment} 
                  label="Department" 
                  onChange={e => setFilterDepartment(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    }
                  }}
                >
                  <MenuItem value=""><em>All Departments</em></MenuItem>
                  {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel sx={{ color: '#667eea', fontWeight: 500 }}>Version</InputLabel>
                <Select 
                  value={filterVersion} 
                  label="Version" 
                  onChange={e => setFilterVersion(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    }
                  }}
                >
                  <MenuItem value=""><em>All Versions</em></MenuItem>
                  {uniqueVersions.map(version => <MenuItem key={version} value={version}>{version}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                size="medium"
                placeholder="Search SOPs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ 
                  startAdornment: <Search sx={{ mr: 1, color: '#667eea' }} /> 
                }}
                sx={{ 
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Modern SOPs Table */}
      <Fade in timeout={1200}>
        <Card sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }
                }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSOPs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Description sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                          No SOPs Found
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {search || filterDepartment || filterVersion 
                            ? 'Try adjusting your filters or search terms'
                            : 'Get started by adding your first SOP'
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSOPs.map((sop, index) => (
                    <TableRow 
                      key={sop.id}
                      sx={{ 
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.02))',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        },
                        transition: 'all 0.3s ease',
                        '&:nth-of-type(even)': {
                          background: 'rgba(102, 126, 234, 0.02)'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          {sop.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={sop.version || 'N/A'} 
                          size="small"
                          sx={{ 
                            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sop.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {sop.fileUrl ? (
                          <Tooltip title="Download file">
                            <IconButton 
                              href={sop.fileUrl} 
                              target="_blank" 
                              rel="noopener" 
                              download={sop.fileName}
                              sx={{
                                color: '#4CAF50',
                                '&:hover': {
                                  background: 'rgba(76, 175, 80, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No file
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit SOP">
                            <IconButton 
                              onClick={() => handleOpenDialog(sop)}
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                borderRadius: 2,
                                width: 40,
                                height: 40,
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                  transform: 'translateY(-2px) scale(1.05)',
                                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '& .MuiSvgIcon-root': {
                                  fontSize: '1.2rem'
                                }
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete SOP">
                            <IconButton 
                              onClick={() => handleDeleteClick(sop.id, sop.fileUrl)} 
                              sx={{
                                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                color: 'white',
                                borderRadius: 2,
                                width: 40,
                                height: 40,
                                boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                                  transform: 'translateY(-2px) scale(1.05)',
                                  boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)'
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '& .MuiSvgIcon-root': {
                                  fontSize: '1.2rem'
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Fade>
      {/* Modern Add/Edit SOP Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          {editMode ? 'Edit SOP' : 'Add New SOP'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Title"
              value={currentSOP.title || ''}
              onChange={e => setCurrentSOP(s => ({ ...s, title: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
            />
            <TextField
              label="Version"
              value={currentSOP.version || ''}
              onChange={e => setCurrentSOP(s => ({ ...s, version: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
            />
            <TextField
              label="Description"
              value={currentSOP.description || ''}
              onChange={e => setCurrentSOP(s => ({ ...s, description: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                }
              }}
            />
            <Box sx={{ 
              border: '2px dashed rgba(102, 126, 234, 0.3)',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'rgba(102, 126, 234, 0.5)',
                background: 'rgba(102, 126, 234, 0.05)'
              }
            }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    background: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {file ? file.name : currentSOP.fileName || 'Upload File'}
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Click to select a file or drag and drop
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={uploading}
            sx={{
              color: '#666',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={uploading || !currentSOP.title}
            sx={{
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {uploading ? 'Saving...' : (editMode ? 'Save Changes' : 'Add SOP')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modern Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          Delete SOP
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <Delete sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
              Are you sure you want to delete this SOP?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This action cannot be undone and will permanently remove the SOP and its associated file.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
          <Button 
            onClick={handleCancelDelete}
            sx={{
              color: '#666',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Delete SOP
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for success/error */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 