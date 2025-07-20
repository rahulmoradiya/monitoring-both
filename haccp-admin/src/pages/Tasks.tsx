import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Select, MenuItem, FormControl, InputLabel, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Tabs, Tab
} from '@mui/material';
import { Edit, Delete, FilterList, Add, CheckCircle, Cancel } from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, getDocs, collectionGroup, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import SOPSelectDialog, { SOP as SOPType } from '../components/SOPSelect/SOPSelectDialog';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  department: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedRoles: string[];
  assignedUsers: string[];
  createdBy: string;
  createdAt: any;
  updatedBy?: string;
  updatedAt?: any;
  linkedItemId?: string;
  linkedItemTitle?: string;
  frequency?: string;
  taskType?: string;
}

const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  sop: 'primary',
  monitoring: 'success',
  personal: 'info',
};
const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  active: 'primary',
  completed: 'success',
  inactive: 'default',
  overdue: 'error',
};
const priorities = ['Low', 'Medium', 'High'];
const types = [
  { value: 'detail', label: 'Detailed Task' },
  { value: 'checklist', label: 'Checklist' },
];
const FREQUENCIES = ['Once a day', 'Once a week', 'Once a month', 'One-time task'];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<{ uid: string; name: string }[]>([]);
  const [companyCode, setCompanyCode] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sopList, setSopList] = useState<{ id: string; title: string; description: string }[]>([]);
  const [monitoringList, setMonitoringList] = useState<{
    id: string;
    name: string;
    type: string;
    description?: string;
    department?: string;
    details?: { startDate?: string; startTime?: string; frequency?: string };
    responsibility?: string;
    inUse?: boolean;
  }[]>([]);

  // Permissions: Only allow admins or Task Managers
  const [canEdit, setCanEdit] = useState(false);

  // State for Assign to Team Member modal
  const [assignTeamMemberOpen, setAssignTeamMemberOpen] = useState(false);
  const [teamTask, setTeamTask] = useState({
    id: '',
    title: '',
    description: '',
    status: 'active',
    priority: 'Medium',
    dueDate: '',
    assignedUserIds: [] as string[],
    sopIds: [] as string[],
    sopDetails: [] as { id: string; title: string; description: string }[],
  });
  const [sopSearch, setSopSearch] = useState('');
  const [filteredSOPs, setFilteredSOPs] = useState<{ id: string; title: string; description: string }[]>([]);
  // State for SOP select dialog in Assign to Team Member modal
  const [sopDialogOpen, setSopDialogOpen] = useState(false);
  const [selectedSOPs, setSelectedSOPs] = useState<SOPType[]>([]);

  // State for SOP select dialog in Assign Monitoring Task modal
  const [monitoringSopDialogOpen, setMonitoringSopDialogOpen] = useState(false);
  const [monitoringSelectedSOPs, setMonitoringSelectedSOPs] = useState<SOPType[]>([]);

  // State for tabs
  const [activeTab, setActiveTab] = useState<'monitoring' | 'teamMember'>('monitoring');
  const [teamMemberTasks, setTeamMemberTasks] = useState<any[]>([]);

  useEffect(() => {
    // Fetch companyCode, roles, users, and check permissions
    const fetchMeta = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          const userData = userDoc.data();
          setCompanyCode(userData.companyCode);
          setCanEdit(true); // Allow all users to add tasks
          // Fetch roles
          const rolesSnap = await getDocs(collection(db, 'companies', userData.companyCode, 'roles'));
          setRoles(rolesSnap.docs.map(doc => doc.data().name));
          // Fetch users
          const companyUsers = usersSnap.docs.filter(doc => doc.data().companyCode === userData.companyCode);
          setUsers(companyUsers.map(doc => ({ uid: doc.data().uid, name: doc.data().name || doc.data().email })));
          // Fetch departments
          const deptSnap = await getDocs(collection(db, 'companies', userData.companyCode, 'departments'));
          setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
        }
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!companyCode) return;
    // Fetch all tasks from both collections
    const fetchTasks = async () => {
      // Fetch from detailedMonitoring collection
      const detailedTasksSnap = await getDocs(collection(db, 'companies', companyCode, 'detailedMonitoring'));
      const detailedTasks = detailedTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Fetch from checklistMonitoring collection
      const checklistTasksSnap = await getDocs(collection(db, 'companies', companyCode, 'checklistMonitoring'));
      const checklistTasks = checklistTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Combine both collections
      setTasks([...detailedTasks, ...checklistTasks]);
    };
    fetchTasks();
    // Fetch all SOPs
    const fetchSOPs = async () => {
      const sopsSnap = await getDocs(collection(db, 'companies', companyCode, 'sops'));
      setSopList(sopsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title, description: doc.data().description || '' })));
    };
    fetchSOPs();
  }, [companyCode]);

  // Filtering logic
  const filteredTasks = tasks.filter(task =>
    (!filterType || task.type === filterType) &&
    (!filterStatus || task.status === filterStatus) &&
    (!filterDepartment || task.department === filterDepartment) &&
    (!filterRole || task.assignedRoles.includes(filterRole)) &&
    (!filterUser || task.assignedUsers.includes(filterUser)) &&
    (!search || task.title.toLowerCase().includes(search.toLowerCase()) || (task.description && task.description.toLowerCase().includes(search.toLowerCase())))
  );

  // Delete logic
  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!taskToDelete || !companyCode) return;
    
    // Check if it's a team member task
    const teamMemberTask = teamMemberTasks.find(t => t.id === taskToDelete);
    if (teamMemberTask) {
      await deleteDoc(doc(db, 'companies', companyCode, 'teamMemberTasks', taskToDelete));
      setTeamMemberTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      return;
    }
    
    // Handle monitoring tasks
    const task = tasks.find(t => t.id === taskToDelete);
    if (!task) return;
    
    const collectionName = getCollectionName(task);
    await deleteDoc(doc(db, 'companies', companyCode, collectionName, taskToDelete));
    setTasks(prev => prev.filter(t => t.id !== taskToDelete));
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  // Create/Edit logic
  const handleOpenDialog = (task?: Task) => {
    setEditMode(!!task);
    setCurrentTask(task ? { ...task } : { assignedRoles: [], assignedUsers: [], status: 'active', priority: 'Medium', type: 'monitoring' });
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentTask({});
    setEditMode(false);
    setSaving(false);
  };
  const handleSave = async () => {
    if (!companyCode || !currentTask.title) return;
    setSaving(true);
    try {
      // Determine collection name based on selected task type
      const taskType = currentTask.taskType || 'detailed';
      const collectionName = taskType === 'detailed' ? 'detailedMonitoring' : 'checklistMonitoring';
      
      const taskData = {
        ...currentTask,
        department: currentTask.department || '',
        assignedRoles: currentTask.assignedRoles || [],
        assignedUsers: currentTask.assignedUsers || [],
        status: currentTask.status || 'active',
        priority: currentTask.priority || 'Medium',
        type: currentTask.type || 'monitoring',
        taskType: taskType, // Add the task type to the data
        createdAt: currentTask.createdAt || Timestamp.now(),
        createdBy: currentTask.createdBy || (auth.currentUser?.uid || ''),
      };
      
      if (editMode && currentTask.id) {
        await updateDoc(doc(db, 'companies', companyCode, collectionName, currentTask.id), taskData);
        setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, ...taskData } as Task : t));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, collectionName), taskData);
        setTasks(prev => [
          ...prev,
          {
            id: docRef.id,
            title: taskData.title || '',
            description: taskData.description || '',
            type: taskData.type || 'monitoring',
            department: taskData.department || '',
            status: taskData.status || 'active',
            priority: taskData.priority || 'Medium',
            dueDate: taskData.dueDate || '',
            assignedRoles: taskData.assignedRoles || [],
            assignedUsers: taskData.assignedUsers || [],
            createdBy: taskData.createdBy || '',
            createdAt: taskData.createdAt || Timestamp.now(),
            updatedBy: taskData.updatedBy || '',
            updatedAt: taskData.updatedAt || '',
            linkedItemId: taskData.linkedItemId || '',
            linkedItemTitle: taskData.linkedItemTitle || '',
            taskType: taskData.taskType || 'detailed',
          }
        ]);
      }
      setDialogOpen(false);
      setCurrentTask({});
      setEditMode(false);
      setSaving(false);
    } catch (err) {
      setSaving(false);
    }
  };
  // Helper function to determine collection name based on task
  const getCollectionName = (task: Task) => {
    return task.taskType === 'detailed' ? 'detailedMonitoring' : 'checklistMonitoring';
  };

  // Status change from list
  const handleStatusChange = async (id: string, status: string) => {
    if (!companyCode) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const collectionName = getCollectionName(task);
    await updateDoc(doc(db, 'companies', companyCode, collectionName, id), { status });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // Fetch Monitoring tasks when dialog opens - based on selected task type
  useEffect(() => {
    if (!companyCode || !dialogOpen) return;
    
    const fetchMonitoringTasks = async () => {
      try {
        let collectionName = '';
        
        // Determine collection based on current task type
        if (currentTask.taskType === 'detailed') {
          collectionName = 'detailedCreation';
        } else if (currentTask.taskType === 'checklist') {
          collectionName = 'checklistCreation';
        } else {
          // Default to detailedCreation if no task type selected
          collectionName = 'detailedCreation';
        }
        
        const querySnapshot = await getDocs(collection(db, 'companies', companyCode, collectionName));
        const fetchedTasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type || 'detailed',
          description: doc.data().description || '',
          department: doc.data().department || '',
          details: doc.data().details || {},
          responsibility: doc.data().responsibility || '',
          inUse: doc.data().inUse || true,
        }));
        
        setMonitoringList(fetchedTasks);
      } catch (error) {
        console.error('Error fetching monitoring tasks:', error);
        setMonitoringList([]);
      }
    };
    
    fetchMonitoringTasks();
  }, [companyCode, dialogOpen, currentTask.taskType]);



  // Open Assign to Team Member modal
  const handleOpenAssignTeamMember = () => {
    setTeamTask({
      id: '',
      title: '',
      description: '',
      status: 'active',
      priority: 'Medium',
      dueDate: '',
      assignedUserIds: [],
      sopIds: [],
      sopDetails: [],
    });
    setAssignTeamMemberOpen(true);
  };
  const handleCloseAssignTeamMember = () => {
    setAssignTeamMemberOpen(false);
  };
  // SOP search logic
  useEffect(() => {
    if (!sopList.length) return;
    if (!sopSearch) setFilteredSOPs(sopList);
    else setFilteredSOPs(sopList.filter(sop => sop.title.toLowerCase().includes(sopSearch.toLowerCase()) || (sop.description && sop.description.toLowerCase().includes(sopSearch.toLowerCase()))));
  }, [sopSearch, sopList]);
  // Add SOP to task
  const handleAddSOPToTask = (sop: { id: string; title: string; description: string }) => {
    if (!teamTask.sopIds.includes(sop.id)) {
      setTeamTask(prev => ({
        ...prev,
        sopIds: [...prev.sopIds, sop.id],
        sopDetails: [...prev.sopDetails, { id: sop.id, title: sop.title, description: sop.description }],
      }));
    }
  };
  // Remove SOP from task
  const handleRemoveSOPFromTask = (sopId: string) => {
    setTeamTask(prev => ({
      ...prev,
      sopIds: prev.sopIds.filter(id => id !== sopId),
      sopDetails: prev.sopDetails.filter(sop => sop.id !== sopId),
    }));
  };
  // Submit team member assignment
  const handleAssignTeamMember = async () => {
    if (!companyCode || !teamTask.title || !teamTask.assignedUserIds.length) return;
    const { id, ...taskData } = teamTask; // Remove id from the data to be saved
    const docData = {
      ...taskData,
      createdBy: auth.currentUser?.uid || '',
      createdAt: Timestamp.now(),
      companyCode,
    };
    
    if (id) {
      // Update existing task
      await updateDoc(doc(db, 'companies', companyCode, 'teamMemberTasks', id), docData);
      setTeamMemberTasks(prev => prev.map(t => t.id === id ? { ...t, ...docData } : t));
    } else {
      // Create new task
      const docRef = await addDoc(collection(db, 'companies', companyCode, 'teamMemberTasks'), docData);
      setTeamMemberTasks(prev => [...prev, { id: docRef.id, ...docData }]);
    }
    setAssignTeamMemberOpen(false);
  };

  // When SOPs are selected in the dialog, update teamTask.sopIds and sopDetails
  const handleSOPSelect = (sops: SOPType[]) => {
    setSelectedSOPs(sops);
    setTeamTask(prev => ({
      ...prev,
      sopIds: sops.map(sop => sop.id),
      sopDetails: sops.map(sop => ({ id: sop.id, title: sop.title, description: sop.description || '' })),
    }));
    setSopDialogOpen(false);
  };

  // When SOPs are selected in the dialog, update currentTask.linkedSopIds and linkedSopDetails
  const handleMonitoringSOPSelect = (sops: SOPType[]) => {
    setMonitoringSelectedSOPs(sops);
    setCurrentTask(prev => ({
      ...prev,
      linkedSopIds: sops.map(sop => sop.id),
      linkedSopDetails: sops.map(sop => ({ id: sop.id, title: sop.title, description: sop.description || '' })),
    }));
    setMonitoringSopDialogOpen(false);
  };

  // Handle edit team member task
  const handleEditTeamMemberTask = (task: any) => {
    setTeamTask({
      id: task.id || '',
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'active',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate || '',
      assignedUserIds: task.assignedUserIds || [],
      sopIds: task.sopIds || [],
      sopDetails: task.sopDetails || [],
    });
    setSelectedSOPs(task.sopDetails || []);
    setAssignTeamMemberOpen(true);
  };

  // Handle delete team member task
  const handleDeleteTeamMemberTask = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Fetch team member tasks
  useEffect(() => {
    if (!companyCode) return;
    const fetchTeamMemberTasks = async () => {
      const snap = await getDocs(collection(db, 'companies', companyCode, 'teamMemberTasks'));
      setTeamMemberTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTeamMemberTasks();
  }, [companyCode]);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Monitoring Task Management</Typography>
      <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Monitoring Tasks" value="monitoring" />
        <Tab label="Team Member Tasks" value="teamMember" />
      </Tabs>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        {canEdit && activeTab === 'monitoring' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ mr: 2 }}>Assign Monitoring Task</Button>
        )}
        {canEdit && activeTab === 'teamMember' && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAssignTeamMember}>Assign to Team Member</Button>
        )}
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        {activeTab === 'monitoring' && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select value={filterType} label="Type" onChange={e => setFilterType(e.target.value)}>
                  <MenuItem value=""><em>All</em></MenuItem>
                  {types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Department</InputLabel>
                <Select value={filterDepartment} label="Department" onChange={e => setFilterDepartment(e.target.value)}>
                  <MenuItem value=""><em>All</em></MenuItem>
                  {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select value={filterRole} label="Role" onChange={e => setFilterRole(e.target.value)}>
                  <MenuItem value=""><em>All</em></MenuItem>
                  {roles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>User</InputLabel>
                <Select value={filterUser} label="User" onChange={e => setFilterUser(e.target.value)}>
                  <MenuItem value=""><em>All</em></MenuItem>
                  {users.map(user => <MenuItem key={user.uid} value={user.uid}>{user.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ minWidth: 220 }}
              />
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Assigned Roles</TableCell>
                  <TableCell>Assigned Users</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={task.taskType === 'detailed' ? 'Detailed' : task.taskType === 'checklist' ? 'Checklist' : 'Monitoring'} 
                        color={task.taskType === 'detailed' ? 'primary' : task.taskType === 'checklist' ? 'secondary' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          disabled={!canEdit}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="overdue">Overdue</MenuItem>
                        </Select>
                      </FormControl>
                      <Chip label={task.status} color={statusColors[task.status] || 'default'} size="small" sx={{ ml: 1 }} />
                    </TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      {task.assignedRoles?.map(role => <Chip key={role} label={role} size="small" sx={{ mr: 0.5 }} />)}
                    </TableCell>
                    <TableCell>
                      {task.assignedUsers?.map(uid => {
                        const user = users.find(u => u.uid === uid);
                        return user ? <Chip key={uid} label={user.name} size="small" sx={{ mr: 0.5 }} /> : null;
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <Tooltip title="Edit"><IconButton onClick={() => handleOpenDialog(task)}><Edit /></IconButton></Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteClick(task.id)}><Delete /></IconButton></Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {activeTab === 'teamMember' && (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Assigned Users</TableCell>
                  <TableCell>SOPs</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamMemberTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      {task.assignedUserIds?.map((uid: string) => {
                        const user = users.find(u => u.uid === uid);
                        return user ? <Chip key={uid} label={user.name} size="small" sx={{ mr: 0.5 }} /> : null;
                      })}
                    </TableCell>
                    <TableCell>
                      {task.sopDetails?.map((sop: any) => (
                        <Chip key={sop.id} label={sop.title} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <Tooltip title="Edit"><IconButton onClick={() => handleEditTeamMemberTask(task)}><Edit /></IconButton></Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteTeamMemberTask(task.id)}><Delete /></IconButton></Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Paper>
      {/* Create/Edit Task Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Monitoring Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth sx={{ mt: 2 }} required error={!currentTask.taskType}>
            <InputLabel>Monitoring Task*</InputLabel>
            <Select
              value={currentTask.taskType || 'detailed'}
              label="Monitoring Task*"
              onChange={e => setCurrentTask(t => ({ ...t, taskType: e.target.value, linkedItemId: '', linkedItemTitle: '' }))}
            >
              <MenuItem value="detailed">Detailed Task</MenuItem>
              <MenuItem value="checklist">Checklist Task</MenuItem>
            </Select>
            {!currentTask.taskType && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                Monitoring Task is required
              </Typography>
            )}
          </FormControl>
          
          {/* Dynamic dropdown based on task type */}
          {currentTask.taskType && (
            <FormControl fullWidth>
              <InputLabel>Select {currentTask.taskType === 'detailed' ? 'Detailed' : 'Checklist'} Task</InputLabel>
              <Select
                value={currentTask.linkedItemId || ''}
                label={`Select ${currentTask.taskType === 'detailed' ? 'Detailed' : 'Checklist'} Task`}
                onChange={e => {
                  const selectedTask = monitoringList.find(task => task.id === e.target.value);
                  setCurrentTask(t => ({ 
                    ...t, 
                    linkedItemId: e.target.value,
                    linkedItemTitle: selectedTask?.name || ''
                  }));
                }}
              >
                {monitoringList.map(task => (
                  <MenuItem key={task.id} value={task.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{task.name}</span>
                      <Chip
                        label={task.type === 'detailed' ? 'Detailed' : 'Checklist'}
                        color={task.type === 'detailed' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {/* Always show Title input, editable */}
          <TextField
            label="Title*"
            value={currentTask.title || ''}
            onChange={e => setCurrentTask(t => ({ ...t, title: e.target.value }))}
            fullWidth
            required
            error={!currentTask.title}
            helperText={!currentTask.title ? 'Title is required' : ''}
          />
          <TextField
            label="Description"
            value={currentTask.description || ''}
            onChange={e => setCurrentTask(t => ({ ...t, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={currentTask.status || 'active'}
              label="Status"
              onChange={e => setCurrentTask(t => ({ ...t, status: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={currentTask.priority || 'Medium'}
              label="Priority"
              onChange={e => setCurrentTask(t => ({ ...t, priority: e.target.value }))}
            >
              {priorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Start Date*"
            type="date"
            value={currentTask.dueDate || ''}
            onChange={e => setCurrentTask(t => ({ ...t, dueDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            error={!currentTask.dueDate}
            helperText={!currentTask.dueDate ? 'Start Date is required' : ''}
          />
          <FormControl fullWidth required error={!currentTask.frequency}>
            <InputLabel>Frequency*</InputLabel>
            <Select
              value={currentTask.frequency || ''}
              label="Frequency*"
              onChange={e => setCurrentTask(t => ({ ...t, frequency: e.target.value }))}
            >
              {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
            {!currentTask.frequency && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                Frequency is required
              </Typography>
            )}
          </FormControl>
          <FormControl fullWidth required error={!currentTask.assignedRoles || currentTask.assignedRoles.length === 0}>
            <InputLabel>Assign to Roles*</InputLabel>
            <Select
              multiple
              value={currentTask.assignedRoles || []}
              onChange={e => setCurrentTask(t => ({ ...t, assignedRoles: e.target.value as string[] }))}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(value => <Chip key={value} label={value} />)}
                </Box>
              )}
            >
              {roles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </Select>
            {(!currentTask.assignedRoles || currentTask.assignedRoles.length === 0) && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                Assign to Roles is required
              </Typography>
            )}
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Assign to Users</InputLabel>
            <Select
              multiple
              value={currentTask.assignedUsers || []}
              onChange={e => setCurrentTask(t => ({ ...t, assignedUsers: e.target.value as string[] }))}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(uid => {
                    const user = users.find(u => u.uid === uid);
                    return user ? <Chip key={uid} label={user.name} /> : null;
                  })}
                </Box>
              )}
            >
              {users.map(user => <MenuItem key={user.uid} value={user.uid}>{user.name}</MenuItem>)}
            </Select>
          </FormControl>
          {/* SOP Attach/Search for Monitoring Task */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Attach SOP(s)</Typography>
            <Button variant="outlined" onClick={() => setMonitoringSopDialogOpen(true)} sx={{ mb: 1 }}>
              {monitoringSelectedSOPs.length > 0 ? 'Edit SOPs' : 'Add SOPs'}
            </Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {monitoringSelectedSOPs.map(sop => (
                <Chip key={sop.id} label={sop.title} onDelete={() => handleMonitoringSOPSelect(monitoringSelectedSOPs.filter(s => s.id !== sop.id))} />
              ))}
            </Box>
            <SOPSelectDialog
              open={monitoringSopDialogOpen}
              sops={sopList}
              selected={monitoringSelectedSOPs}
              onClose={() => setMonitoringSopDialogOpen(false)}
              onSelect={handleMonitoringSOPSelect}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !currentTask.title || !currentTask.taskType || !currentTask.dueDate || !currentTask.frequency || !currentTask.assignedRoles || currentTask.assignedRoles.length === 0}
          >
            {saving ? 'Saving...' : (editMode ? 'Save' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Assign to Team Member Modal */}
      <Dialog open={assignTeamMemberOpen} onClose={handleCloseAssignTeamMember} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Personal Task to Team Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Task Title*"
            value={teamTask.title}
            onChange={e => setTeamTask(t => ({ ...t, title: e.target.value }))}
            fullWidth
            required
            error={!teamTask.title}
            helperText={!teamTask.title ? 'Task Title is required' : ''}
          />
          <TextField
            label="Description"
            value={teamTask.description}
            onChange={e => setTeamTask(t => ({ ...t, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={teamTask.status}
              label="Status"
              onChange={e => setTeamTask(t => ({ ...t, status: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={teamTask.priority}
              label="Priority"
              onChange={e => setTeamTask(t => ({ ...t, priority: e.target.value }))}
            >
              {priorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Due Date*"
            type="date"
            value={teamTask.dueDate}
            onChange={e => setTeamTask(t => ({ ...t, dueDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            error={!teamTask.dueDate}
            helperText={!teamTask.dueDate ? 'Due Date is required' : ''}
          />
          <FormControl fullWidth required error={!teamTask.assignedUserIds || teamTask.assignedUserIds.length === 0}>
            <InputLabel>Assign to Team Member*</InputLabel>
            <Select
              multiple
              value={teamTask.assignedUserIds}
              onChange={e => setTeamTask(t => ({ ...t, assignedUserIds: e.target.value as string[] }))}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(uid => {
                    const user = users.find(u => u.uid === uid);
                    return user ? <Chip key={uid} label={user.name} /> : null;
                  })}
                </Box>
              )}
            >
              {users.map(user => <MenuItem key={user.uid} value={user.uid}>{user.name}</MenuItem>)}
            </Select>
            {(!teamTask.assignedUserIds || teamTask.assignedUserIds.length === 0) && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                Assign to Team Member is required
              </Typography>
            )}
          </FormControl>
          {/* SOP Attach/Search */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Attach SOP(s)</Typography>
            <Button variant="outlined" onClick={() => setSopDialogOpen(true)} sx={{ mb: 1 }}>
              {selectedSOPs.length > 0 ? 'Edit SOPs' : 'Add SOPs'}
            </Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedSOPs.map(sop => (
                <Chip key={sop.id} label={sop.title} onDelete={() => handleSOPSelect(selectedSOPs.filter(s => s.id !== sop.id))} />
              ))}
            </Box>
            <SOPSelectDialog
              open={sopDialogOpen}
              sops={sopList}
              selected={selectedSOPs}
              onClose={() => setSopDialogOpen(false)}
              onSelect={handleSOPSelect}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignTeamMember}>Cancel</Button>
          <Button onClick={handleAssignTeamMember} variant="contained" disabled={!teamTask.title || !teamTask.dueDate || !teamTask.assignedUserIds.length}>Assign</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this task? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 