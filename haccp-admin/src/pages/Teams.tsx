import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Typography,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { SelectChangeEvent } from '@mui/material/Select';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc, getDoc, getDocs, collectionGroup, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Role {
  id: string;
  name: string;
  responsibilities: string[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  role: string;
  responsibilities: string[];
}

const initialRoles: Role[] = [
  { 
    id: '1', 
    name: 'Admin', 
    responsibilities: ['System configuration', 'User management', 'Data access control'] 
  },
  { 
    id: '2', 
    name: 'Manager', 
    responsibilities: ['Team supervision', 'Project coordination', 'Reporting'] 
  },
  { 
    id: '3', 
    name: 'Staff', 
    responsibilities: ['Data entry', 'Monitoring', 'Basic reporting'] 
  },
];

const initialMembers: TeamMember[] = [
  { 
    id: '1', 
    name: 'Rahul Moradiya', 
    email: 'rahul@example.com', 
    departmentId: '1',
    departmentName: 'IT',
    role: 'Admin',
    responsibilities: ['System configuration', 'User management', 'Data access control'],
  },
  { 
    id: '2', 
    name: 'Jane Doe', 
    email: 'jane@example.com', 
    departmentId: '2',
    departmentName: 'HR',
    role: 'Manager',
    responsibilities: ['Team supervision', 'Project coordination', 'Reporting'],
  },
];

export default function Teams() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember & { password?: string }>>({});
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({});
  const [newResponsibility, setNewResponsibility] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [editDeptDialogOpen, setEditDeptDialogOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<{ id: string; name: string } | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Member management
  const handleMemberOpen = () => {
    setEditMode(false);
    setCurrentMember({});
    setMemberDialogOpen(true);
  };
  const handleMemberEdit = (member: TeamMember) => {
    setEditMode(true);
    setCurrentMember(member);
    setMemberDialogOpen(true);
  };
  const handleMemberClose = () => {
    setMemberDialogOpen(false);
    setCurrentMember({});
  };
  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMember((prev) => ({ ...prev, [name]: value }));
  };
  const handleMemberSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    const selectedRole = roles.find(role => role.name === value);
    setCurrentMember((prev) => ({ 
      ...prev, 
      [name!]: value,
      responsibilities: selectedRole?.responsibilities || []
    }));
  };
  const handleMemberSave = async () => {
    if (!currentMember.name || !currentMember.departmentId || !currentMember.role || !currentMember.email || (!editMode && !currentMember.password) || (!editMode && !adminPassword)) return;
    if (!editMode) {
      try {
        const adminEmail = auth.currentUser?.email;
        const userCredential = await createUserWithEmailAndPassword(auth, currentMember.email as string, currentMember.password as string);
        const newUser = userCredential.user;
        if (currentUser?.companyCode) {
          await setDoc(doc(db, 'companies', currentUser.companyCode, 'users', newUser.uid), {
            uid: newUser.uid,
            email: currentMember.email,
            name: currentMember.name || '',
            departmentId: currentMember.departmentId || '',
            departmentName: currentMember.departmentName || '',
            companyCode: currentUser.companyCode,
            role: currentMember.role,
            responsibilities: currentMember.responsibilities || [],
            createdAt: new Date(),
          });
        }
        // After creating the new user, sign back in as admin
        if (adminEmail && adminPassword) {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        }
      } catch (error: any) {
        alert(error.message);
        return;
      }
      setMembers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: currentMember.name!,
          email: currentMember.email!,
          departmentId: currentMember.departmentId!,
          departmentName: currentMember.departmentName!,
          role: currentMember.role!,
          responsibilities: currentMember.responsibilities || [],
        },
      ]);
      setAdminPassword(''); // Clear admin password after use
    }
    // Edit mode: update existing member in state and Firestore
    setMembers((prev) => prev.map(m => m.id === currentMember.id ? {
      ...m,
      name: currentMember.name!,
      email: currentMember.email!,
      departmentId: currentMember.departmentId!,
      departmentName: currentMember.departmentName!,
      role: currentMember.role!,
      responsibilities: currentMember.responsibilities || [],
    } : m));
    if (companyCode && currentMember.id) {
      await updateDoc(doc(db, 'companies', companyCode, 'users', currentMember.id), {
        name: currentMember.name!,
        email: currentMember.email!,
        departmentId: currentMember.departmentId!,
        departmentName: currentMember.departmentName!,
        role: currentMember.role!,
        responsibilities: currentMember.responsibilities || [],
      });
    }
    // Do NOT update setCurrentUser with new member's data here
    handleMemberClose();
  };
  const handleMemberDelete = (id: string) => {
    if (userRole !== 'owner') {
      setAlertOpen(true);
      return;
    }
    const member = members.find(m => m.id === id) || null;
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteMember = async () => {
    if (!memberToDelete || !companyCode) return;
    try {
      console.log('Deleting member:', memberToDelete);
      await deleteDoc(doc(db, 'companies', companyCode, 'users', memberToDelete.id));
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error: any) {
      alert('Error deleting member: ' + error.message);
    }
  };

  // Role management
  const handleRoleOpen = () => {
    setEditMode(false);
    setCurrentRole({});
    setRoleDialogOpen(true);
  };
  const handleRoleEdit = (role: Role) => {
    setEditMode(true);
    setCurrentRole(role);
    setRoleDialogOpen(true);
  };
  const handleRoleClose = () => {
    setRoleDialogOpen(false);
    setCurrentRole({});
    setNewResponsibility('');
  };
  const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRole((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setCurrentRole((prev) => ({
        ...prev,
        responsibilities: [...(prev.responsibilities || []), newResponsibility.trim()]
      }));
      setNewResponsibility('');
    }
  };
  const handleRemoveResponsibility = (index: number) => {
    setCurrentRole((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities?.filter((_, i) => i !== index) || []
    }));
  };
  const handleRoleSave = async () => {
    if (!currentRole.name || !currentRole.responsibilities) return;
    if (editMode && currentRole.id) {
      // Update role in Firestore
      if (companyCode) {
        await updateDoc(doc(db, 'companies', companyCode, 'roles', String(currentRole.id)), {
          name: currentRole.name,
          responsibilities: currentRole.responsibilities,
        });
        setRoles((prev) => prev.map((r) => (r.id === currentRole.id ? { ...r, ...currentRole } as Role : r)));
      }
    } else {
      // Add new role to Firestore
      if (companyCode) {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'roles'), {
          name: currentRole.name,
          responsibilities: currentRole.responsibilities,
        });
        setRoles((prev) => [
          ...prev,
          { id: docRef.id, name: currentRole.name!, responsibilities: currentRole.responsibilities! },
        ]);
      }
    }
    handleRoleClose();
  };
  const handleRoleDelete = async (id: string) => {
    if (userRole !== 'owner') {
      setAlertOpen(true);
      return;
    }
    // Remove role from local state
    setRoles(prev => prev.filter(r => r.id !== id));
    // Update team members with this role
    setMembers(prev => prev.map(m => m.role === roles.find(r => r.id === id)?.name ? { ...m, role: 'not set', responsibilities: ['not set'] } : m));
    // Optionally, update in Firestore as well
    if (!companyCode) return;
    const membersSnap = await getDocs(collection(db, 'companies', companyCode, 'users'));
    const deletedRole = roles.find(r => r.id === id)?.name;
    for (const docSnap of membersSnap.docs) {
      const data = docSnap.data();
      if (data.role === deletedRole) {
        await updateDoc(doc(db, 'companies', companyCode, 'users', docSnap.id), {
          role: 'not set',
          responsibilities: ['not set'],
        });
      }
    }
    // Remove role from Firestore
    await deleteDoc(doc(db, 'companies', companyCode, 'roles', id));
  };

  // Invitation logic
  const handleInvite = () => {
    if (!currentMember.name || !currentMember.email || !currentMember.role) return;
    setCurrentMember((prev) => ({ ...prev, invitationStatus: 'Pending' }));
  };
  const handleResendInvite = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, invitationStatus: 'Pending' } : m)));
  };

  // Departments management
  useEffect(() => {
    if (!companyCode) return;
    const fetchDepartments = async () => {
      const deptSnap = await getDocs(collection(db, 'companies', companyCode, 'departments'));
      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
    };
    fetchDepartments();
  }, [companyCode]);

  const handleAddDepartment = async () => {
    if (!newDept || !companyCode) return;
    await addDoc(collection(db, 'companies', companyCode, 'departments'), { name: newDept });
    setNewDept('');
    setDeptDialogOpen(false);
    // Refresh list
    const deptSnap = await getDocs(collection(db, 'companies', companyCode, 'departments'));
    setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
  };
  const handleEditDepartment = (dept: { id: string; name: string }) => {
    setDeptToEdit(dept);
    setEditDeptName(dept.name);
    setEditDeptDialogOpen(true);
  };
  const handleSaveEditDepartment = async () => {
    if (!deptToEdit || !editDeptName.trim() || !companyCode) return;
    await updateDoc(doc(db, 'companies', companyCode, 'departments', deptToEdit.id), { name: editDeptName.trim() });
    setDepartments(prev => prev.map(d => d.id === deptToEdit.id ? { ...d, name: editDeptName.trim() } : d));
    setEditDeptDialogOpen(false);
    setDeptToEdit(null);
    setEditDeptName('');
  };
  const handleDeleteDepartment = async (id: string) => {
    if (userRole !== 'owner') {
      setAlertOpen(true);
      return;
    }
    if (!companyCode) return;
    await deleteDoc(doc(db, 'companies', companyCode, 'departments', id));
    setDepartments(prev => prev.filter(d => d.id !== id));
    setDeptToDelete(null);
    // Update team members with this department
    setMembers(prev => prev.map(m => m.departmentId === id ? { ...m, departmentId: 'not set', departmentName: 'not set' } : m));
    // Optionally, update in Firestore as well
    const membersSnap = await getDocs(collection(db, 'companies', companyCode, 'users'));
    for (const docSnap of membersSnap.docs) {
      const data = docSnap.data();
      if (data.departmentId === id) {
        await updateDoc(doc(db, 'companies', companyCode, 'users', docSnap.id), {
          departmentId: 'not set',
          departmentName: 'not set',
        });
      }
    }
  };

  useEffect(() => {
    // Fetch current user from Firebase Auth and Firestore
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setCurrentUser(userDoc.data());
          setCompanyCode(userDoc.data().companyCode);
          setUserRole(userDoc.data().role || '');
        }
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Fetch roles for the current company
    const fetchRoles = async () => {
      if (!companyCode) return;
      const rolesSnap = await getDocs(collection(db, 'companies', companyCode, 'roles'));
      const rolesList = rolesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          responsibilities: data.responsibilities || [],
        } as Role;
      });
      setRoles(rolesList);
    };
    fetchRoles();
  }, [companyCode]);

  useEffect(() => {
    // Fetch team members for the current company
    const fetchMembers = async () => {
      if (!companyCode) return;
      const membersSnap = await getDocs(collection(db, 'companies', companyCode, 'users'));
      const membersList = membersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          departmentId: data.departmentId || '',
          departmentName: data.departmentName || '',
          role: data.role || '',
          responsibilities: data.responsibilities || [],
        } as TeamMember;
      });
      setMembers(membersList);
    };
    fetchMembers();
  }, [companyCode]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#222' }}>
        Teams Management
      </Typography>
      </Box>

      {/* Roles Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Roles & Responsibilities</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleRoleOpen}>
            Add Role
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Responsibilities</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow key="owner-role">
                <TableCell>Owner</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label="Full access to all features and settings" size="small" variant="outlined" />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {/* No edit/delete buttons for Owner */}
                </TableCell>
              </TableRow>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.responsibilities.map((resp, index) => (
                        <Chip key={index} label={resp} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleRoleEdit(role)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => {
                        if (userRole !== 'owner') {
                          setAlertOpen(true);
                        } else {
                          handleRoleDelete(role.id);
                        }
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Team Members Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Team Members</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleMemberOpen}>
            Add Member
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Responsibilities</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {member.responsibilities.map((resp, index) => (
                        <Chip key={index} label={resp} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleMemberEdit(member)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {member.role !== 'owner' && (
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => {
                          if (userRole !== 'owner') {
                            setAlertOpen(true);
                          } else {
                            handleMemberDelete(member.id);
                          }
                        }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Departments Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Departments</Typography>
          <Button variant="contained" onClick={() => setDeptDialogOpen(true)}>
            Add Department
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleEditDepartment(dept)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => {
                        if (userRole !== 'owner') {
                          setAlertOpen(true);
                        } else {
                          setDeptToDelete(dept.id);
                        }
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Add Department Dialog */}
        <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)}>
          <DialogTitle>Add Department</DialogTitle>
          <DialogContent>
            <TextField
              label="Department Name"
              value={newDept}
              onChange={e => setNewDept(e.target.value)}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDepartment} variant="contained" disabled={!newDept}>Add</Button>
          </DialogActions>
        </Dialog>
        {/* Edit Department Dialog */}
        <Dialog open={editDeptDialogOpen} onClose={() => setEditDeptDialogOpen(false)}>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogContent>
            <TextField
              label="Department Name"
              value={editDeptName}
              onChange={e => setEditDeptName(e.target.value)}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDeptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditDepartment} variant="contained" disabled={!editDeptName.trim()}>Save</Button>
          </DialogActions>
        </Dialog>
        {/* Delete Department Confirmation Dialog */}
        <Dialog open={!!deptToDelete} onClose={() => setDeptToDelete(null)}>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this department? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeptToDelete(null)}>Cancel</Button>
            <Button onClick={() => deptToDelete && handleDeleteDepartment(deptToDelete)} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={handleMemberClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentMember.name || ''}
            onChange={handleMemberInputChange}
            fullWidth
            required
            autoFocus
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={currentMember.departmentId || ''}
              label="Department"
              onChange={e => {
                const dept = departments.find(d => d.id === e.target.value);
                setCurrentMember(prev => ({
                  ...prev,
                  departmentId: dept?.id || '',
                  departmentName: dept?.name || ''
                }));
              }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={currentMember.role || ''}
              label="Role"
              onChange={handleMemberSelectChange}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Email"
            name="email"
            value={currentMember.email || ''}
            onChange={handleMemberInputChange}
            fullWidth
            required
            type="email"
          />
          {!editMode && (
            <TextField
              margin="dense"
              label="Password"
              name="password"
              value={currentMember.password || ''}
              onChange={handleMemberInputChange}
              fullWidth
              required
              type="password"
            />
          )}
          {!editMode && (
            <TextField
              margin="dense"
              label="Your Admin Password (for re-authentication)"
              name="adminPassword"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              fullWidth
              required
              type="password"
              helperText="Please enter your own password to stay logged in after adding a member."
            />
          )}
          {currentMember.role && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Responsibilities:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {currentMember.responsibilities?.map((resp, index) => (
                  <Chip key={index} label={resp} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMemberClose}>Cancel</Button>
          <Button onClick={handleMemberSave} variant="contained" disabled={
            !currentMember.name ||
            !currentMember.departmentId ||
            !currentMember.role ||
            !currentMember.email ||
            (!editMode && !currentMember.password)
          }>{editMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={handleRoleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Role Name"
            name="name"
            value={currentRole.name || ''}
            onChange={handleRoleInputChange}
            fullWidth
            required
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Responsibilities:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                label="Add responsibility"
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddResponsibility()}
                sx={{ flexGrow: 1 }}
              />
              <Button onClick={handleAddResponsibility} variant="outlined">Add</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {currentRole.responsibilities?.map((resp, index) => (
                <Chip 
                  key={index} 
                  label={resp} 
                  size="small" 
                  variant="outlined"
                  onDelete={() => handleRemoveResponsibility(index)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRoleClose}>Cancel</Button>
          <Button onClick={handleRoleSave} variant="contained">{editMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <Typography>This action will remove the team member from the team. Are you sure?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteMember} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Dialog for non-owners trying to delete */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>Permission Denied</DialogTitle>
        <DialogContent>
          <Typography>You do not have permission to delete team members. Only the owner can perform this action.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 