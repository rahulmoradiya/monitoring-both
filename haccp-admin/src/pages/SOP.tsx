import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, InputLabel, FormControl, Chip, Checkbox, Avatar
} from '@mui/material';
import { Add, Edit, Delete, CloudUpload, Download, Search } from '@mui/icons-material';
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
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          const userData = userDoc.data();
          setCompanyCode(userData.companyCode);
          // Fetch roles
          const rolesSnap = await getDocs(collection(db, 'companies', userData.companyCode, 'roles'));
          setRoles(rolesSnap.docs.map(doc => doc.data().name));
          // Fetch users
          const companyUsers = usersSnap.docs.filter(doc => doc.data().companyCode === userData.companyCode);
          setUsers(companyUsers.map(doc => ({ uid: doc.data().uid, name: doc.data().name || doc.data().email })));
        }
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
    setEditMode(!!sop);
    setCurrentSOP(sop ? { ...sop } : { assignedRoles: [], assignedUsers: [], version: '' });
    setFile(null);
    setDialogOpen(true);
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
    if (!companyCode || !currentSOP.title) return;
    setUploading(true);
    let fileUrl = currentSOP.fileUrl;
    let fileName = currentSOP.fileName;
    try {
      if (file) {
        // Upload file to storage
        const storageRef = ref(storage, `companies/${companyCode}/sops/${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fileName = file.name;
      }
      const sopData = {
        ...currentSOP,
        version: currentSOP.version || '',
        fileUrl,
        fileName,
        assignedRoles: currentSOP.assignedRoles || [],
        assignedUsers: currentSOP.assignedUsers || [],
        createdAt: currentSOP.createdAt || new Date(),
        department: currentSOP.department || '',
      };
      if (editMode && currentSOP.id) {
        // Find the original SOP
        const originalSOP = sops.find(s => s.id === currentSOP.id);
        if (originalSOP && originalSOP.version !== currentSOP.version) {
          // Version changed: create a new SOP document
          const docRef = await addDoc(collection(db, 'companies', companyCode, 'sops'), {
            ...sopData,
            title: currentSOP.title || '',
            description: currentSOP.description || '',
          });
          setSOPs(prev => [
            ...prev,
            { ...sopData, id: docRef.id, title: currentSOP.title || '', description: currentSOP.description || '' }
          ]);
          setSnackbarMsg('New SOP version added successfully!');
        } else {
          // Version unchanged: update existing SOP
          await updateDoc(doc(db, 'companies', companyCode, 'sops', currentSOP.id), sopData);
          setSOPs(prev => prev.map(s => s.id === currentSOP.id ? { ...s, ...sopData } as SOP : s));
          setSnackbarMsg('SOP updated successfully!');
        }
      } else {
        const newSop: SOP = {
          id: '',
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
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'sops'), newSop);
        setSOPs(prev => [
          ...prev,
          { ...newSop, id: docRef.id }
        ]);
        setSnackbarMsg('SOP added successfully!');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (err) {
      setSnackbarMsg('Failed to save SOP.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteClick = (id: string, fileUrl?: string) => {
    setSopToDelete({ id, fileUrl });
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!sopToDelete || !companyCode) return;
    setDeleteDialogOpen(false);
    try {
      await deleteDoc(doc(db, 'companies', companyCode, 'sops', sopToDelete.id));
      setSOPs(prev => prev.filter(s => s.id !== sopToDelete.id));
      if (sopToDelete.fileUrl) {
        const fileRef = ref(storage, sopToDelete.fileUrl);
        await deleteObject(fileRef);
      }
      setSnackbarMsg('SOP deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to delete SOP.');
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
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Standard Operating Procedures (SOPs)</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => window.location.href='/admin/teams'}>
            Manage Departments
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add SOP
          </Button>
        </Box>
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Department</InputLabel>
            <Select value={filterDepartment} label="Department" onChange={e => setFilterDepartment(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Version</InputLabel>
            <Select value={filterVersion} label="Version" onChange={e => setFilterVersion(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {uniqueVersions.map(version => <MenuItem key={version} value={version}>{version}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search SOPs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            sx={{ minWidth: 260 }}
          />
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>File</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSOPs.map(sop => (
              <TableRow key={sop.id}>
                <TableCell>{sop.title}</TableCell>
                <TableCell>{sop.version}</TableCell>
                <TableCell>{sop.description}</TableCell>
                <TableCell>
                  {sop.fileUrl && (
                    <IconButton href={sop.fileUrl} target="_blank" rel="noopener" download={sop.fileName}>
                      <Download />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(sop)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDeleteClick(sop.id, sop.fileUrl)} color="error"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {/* Add/Edit SOP Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit SOP' : 'Add SOP'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={currentSOP.title || ''}
            onChange={e => setCurrentSOP(s => ({ ...s, title: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Version"
            value={currentSOP.version || ''}
            onChange={e => setCurrentSOP(s => ({ ...s, version: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={currentSOP.description || ''}
            onChange={e => setCurrentSOP(s => ({ ...s, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUpload />}
            disabled={uploading}
          >
            {file ? file.name : currentSOP.fileName || 'Upload File'}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={uploading || !currentSOP.title}>{uploading ? 'Saving...' : (editMode ? 'Save' : 'Add')}</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete SOP</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this SOP? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
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