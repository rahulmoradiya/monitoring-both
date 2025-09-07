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
  Grid,
  Card,
  CardContent,
  CardHeader,
  Fade,
  Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
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
              <GroupsIcon sx={{ 
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
                Teams Management
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Manage your team roles, members, and departments
            </Typography>
          </Box>
        </Card>
      </Fade>

      {/* Modern Roles Section */}
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
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WorkIcon sx={{ color: '#667eea', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Roles & Responsibilities
                </Typography>
                <Chip 
                  label={`${roles.length + 1} ${roles.length === 0 ? 'Role' : 'Roles'}`}
                  sx={{ 
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                />
              </Box>
            }
            action={
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleRoleOpen}
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
                Add Role
              </Button>
            }
          />
          <CardContent>
            <TableContainer sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              <Table>
                <TableHead sx={{ 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))'
                }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Role Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Responsibilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2c3e50' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key="owner-role" sx={{ 
                    '&:hover': { 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.02))' 
                    }
                  }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Owner</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip 
                          label="Full access to all features and settings" 
                          size="small" 
                          sx={{ 
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {/* No edit/delete buttons for Owner */}
                    </TableCell>
                  </TableRow>
                  {roles.map((role) => (
                    <TableRow key={role.id} sx={{ 
                      '&:hover': { 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.02))' 
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 500, color: '#2c3e50' }}>{role.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {role.responsibilities.map((resp, index) => (
                            <Chip 
                              key={index} 
                              label={resp} 
                              size="small" 
                              sx={{ 
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                                border: '1px solid rgba(102, 126, 234, 0.2)',
                                color: '#2c3e50',
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Role">
                          <IconButton 
                            onClick={() => handleRoleEdit(role)} 
                            sx={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              borderRadius: 2,
                              width: 40,
                              height: 40,
                              mr: 1,
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
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Role">
                          <IconButton 
                            onClick={() => {
                              if (userRole !== 'owner') {
                                setAlertOpen(true);
                              } else {
                                handleRoleDelete(role.id);
                              }
                            }}
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
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Fade>

      {/* Modern Team Members Section */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon sx={{ color: '#FF9800', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Team Members
                </Typography>
                <Chip 
                  label={`${members.length} ${members.length === 1 ? 'Member' : 'Members'}`}
                  sx={{ 
                    background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                />
              </Box>
            }
            action={
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleMemberOpen}
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
                Add Member
              </Button>
            }
          />
          <CardContent>
            <TableContainer sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(255, 152, 0, 0.1)'
            }}>
              <Table>
                <TableHead sx={{ 
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))'
                }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Responsibilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2c3e50' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} sx={{ 
                      '&:hover': { 
                        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(245, 124, 0, 0.02))' 
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 500, color: '#2c3e50' }}>{member.name}</TableCell>
                      <TableCell sx={{ color: '#2c3e50' }}>{member.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.role} 
                          size="small" 
                          sx={{ 
                            background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {member.responsibilities.map((resp, index) => (
                            <Chip 
                              key={index} 
                              label={resp} 
                              size="small" 
                              sx={{ 
                                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))',
                                border: '1px solid rgba(255, 152, 0, 0.2)',
                                color: '#2c3e50',
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Member">
                          <IconButton 
                            onClick={() => handleMemberEdit(member)} 
                            sx={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              borderRadius: 2,
                              width: 40,
                              height: 40,
                              mr: 1,
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
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {member.role !== 'owner' && (
                          <Tooltip title="Delete Member">
                            <IconButton 
                              onClick={() => {
                                if (userRole !== 'owner') {
                                  setAlertOpen(true);
                                } else {
                                  handleMemberDelete(member.id);
                                }
                              }}
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
          </CardContent>
        </Card>
      </Fade>

      {/* Modern Departments Section */}
      <Fade in timeout={1200}>
        <Card sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon sx={{ color: '#2196F3', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Departments
                </Typography>
                <Chip 
                  label={`${departments.length} ${departments.length === 1 ? 'Department' : 'Departments'}`}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}
                />
              </Box>
            }
            action={
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setDeptDialogOpen(true)}
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
                Add Department
              </Button>
            }
          />
          <CardContent>
            <TableContainer sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(33, 150, 243, 0.1)'
            }}>
              <Table>
                <TableHead sx={{ 
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(25, 118, 210, 0.05))'
                }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2c3e50' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map(dept => (
                    <TableRow key={dept.id} sx={{ 
                      '&:hover': { 
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(25, 118, 210, 0.02))' 
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 500, color: '#2c3e50' }}>{dept.name}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Department">
                          <IconButton 
                            onClick={() => handleEditDepartment(dept)} 
                            sx={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              borderRadius: 2,
                              width: 40,
                              height: 40,
                              mr: 1,
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
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Department">
                          <IconButton 
                            onClick={() => {
                              if (userRole !== 'owner') {
                                setAlertOpen(true);
                              } else {
                                setDeptToDelete(dept.id);
                              }
                            }}
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
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Fade>
        {/* Modern Add Department Dialog */}
        <Dialog 
          open={deptDialogOpen} 
          onClose={() => setDeptDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 600
          }}>
            Add Department
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <TextField
              label="Department Name"
              value={newDept}
              onChange={e => setNewDept(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={() => setDeptDialogOpen(false)}
              sx={{ 
                color: '#2196F3',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddDepartment} 
              variant="contained" 
              disabled={!newDept}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Modern Edit Department Dialog */}
        <Dialog 
          open={editDeptDialogOpen} 
          onClose={() => setEditDeptDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 600
          }}>
            Edit Department
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <TextField
              label="Department Name"
              value={editDeptName}
              onChange={e => setEditDeptName(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={() => setEditDeptDialogOpen(false)}
              sx={{ 
                color: '#2196F3',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEditDepartment} 
              variant="contained" 
              disabled={!editDeptName.trim()}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Modern Delete Department Confirmation Dialog */}
        <Dialog 
          open={!!deptToDelete} 
          onClose={() => setDeptToDelete(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 600
          }}>
            Delete Department
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography sx={{ 
              color: '#2c3e50',
              fontSize: '1.1rem',
              textAlign: 'center'
            }}>
              Are you sure you want to delete this department? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setDeptToDelete(null)}
              sx={{ 
                color: '#2196F3',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => deptToDelete && handleDeleteDepartment(deptToDelete)} 
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

      {/* Modern Member Dialog */}
      <Dialog 
        open={memberDialogOpen} 
        onClose={handleMemberClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600
        }}>
          {editMode ? 'Edit Member' : 'Add Member'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentMember.name || ''}
            onChange={handleMemberInputChange}
            fullWidth
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" required sx={{ mb: 2 }}>
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
          <FormControl fullWidth margin="dense" required sx={{ mb: 2 }}>
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
            sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
          )}
          {currentMember.role && (
            <Box sx={{ mt: 2, p: 2, background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2c3e50' }}>Responsibilities:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {currentMember.responsibilities?.map((resp, index) => (
                  <Chip 
                    key={index} 
                    label={resp} 
                    size="small" 
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      color: '#2c3e50',
                      fontWeight: 500
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleMemberClose}
            sx={{ 
              color: '#FF9800',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMemberSave} 
            variant="contained" 
            disabled={
              !currentMember.name ||
              !currentMember.departmentId ||
              !currentMember.role ||
              !currentMember.email ||
              (!editMode && !currentMember.password)
            }
            sx={{
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {editMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Role Dialog */}
      <Dialog 
        open={roleDialogOpen} 
        onClose={handleRoleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600
        }}>
          {editMode ? 'Edit Role' : 'Add Role'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            margin="dense"
            label="Role Name"
            name="name"
            value={currentRole.name || ''}
            onChange={handleRoleInputChange}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))', 
            borderRadius: 2 
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2c3e50' }}>Responsibilities:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                label="Add responsibility"
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddResponsibility()}
                sx={{ flexGrow: 1 }}
              />
              <Button 
                onClick={handleAddResponsibility} 
                variant="outlined"
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a67d8',
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {currentRole.responsibilities?.map((resp, index) => (
                <Chip 
                  key={index} 
                  label={resp} 
                  size="small" 
                  sx={{ 
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    color: '#2c3e50',
                    fontWeight: 500
                  }}
                  onDelete={() => handleRemoveResponsibility(index)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleRoleClose}
            sx={{ 
              color: '#667eea',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRoleSave} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {editMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Delete Member Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600
        }}>
          Remove Team Member
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ 
            color: '#2c3e50',
            fontSize: '1.1rem',
            textAlign: 'center'
          }}>
            This action will remove the team member from the team. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              color: '#2196F3',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteMember} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Alert Dialog for non-owners trying to delete */}
      <Dialog 
        open={alertOpen} 
        onClose={() => setAlertOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600
        }}>
          Permission Denied
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ 
            color: '#2c3e50',
            fontSize: '1.1rem',
            textAlign: 'center'
          }}>
            You do not have permission to delete team members. Only the owner can perform this action.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button 
            onClick={() => setAlertOpen(false)} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d32f2f, #c62828)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
              },
              transition: 'all 0.3s ease',
              fontWeight: 600,
              px: 4,
              py: 1
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 