import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Select, MenuItem, FormControl, InputLabel, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import { Edit, Delete, FilterList, Add, CheckCircle, Cancel } from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, getDocs, collectionGroup, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';

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
  { value: 'sop', label: 'SOP' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'personal', label: 'Personal' },
];

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
  const [monitoringList, setMonitoringList] = useState<{ id: string; name: string; description?: string }[]>([]);

  // Permissions: Only allow admins or Task Managers
  const [canEdit, setCanEdit] = useState(false);

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
          setCanEdit(userData.role === 'admin' || userData.role === 'owner' || userData.role === 'Task Manager');
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
    // Fetch all tasks
    const fetchTasks = async () => {
      const tasksSnap = await getDocs(collection(db, 'companies', companyCode, 'tasks'));
      setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    };
    fetchTasks();
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
    await deleteDoc(doc(db, 'companies', companyCode, 'tasks', taskToDelete));
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
    setCurrentTask(task ? { ...task } : { assignedRoles: [], assignedUsers: [], status: 'active', priority: 'Medium', type: 'personal' });
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
      const taskData = {
        ...currentTask,
        department: currentTask.department || '',
        assignedRoles: currentTask.assignedRoles || [],
        assignedUsers: currentTask.assignedUsers || [],
        status: currentTask.status || 'active',
        priority: currentTask.priority || 'Medium',
        type: currentTask.type || 'personal',
        createdAt: currentTask.createdAt || Timestamp.now(),
        createdBy: currentTask.createdBy || (auth.currentUser?.uid || ''),
      };
      if (editMode && currentTask.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'tasks', currentTask.id), taskData);
        setTasks(prev => prev.map(t => t.id === currentTask.id ? { ...t, ...taskData } as Task : t));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'tasks'), taskData);
        setTasks(prev => [
          ...prev,
          {
            id: docRef.id,
            title: taskData.title || '',
            description: taskData.description || '',
            type: taskData.type || 'personal',
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
  // Status change from list
  const handleStatusChange = async (id: string, status: string) => {
    if (!companyCode) return;
    await updateDoc(doc(db, 'companies', companyCode, 'tasks', id), { status });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // Fetch SOPs and Monitoring tasks when dialog opens or type changes
  useEffect(() => {
    if (!companyCode || !dialogOpen) return;
    if (currentTask.type === 'sop') {
      getDocs(collection(db, 'companies', companyCode, 'sops')).then(snap => {
        setSopList(snap.docs.map(doc => ({ id: doc.id, title: doc.data().title, description: doc.data().description || '' })));
      });
    } else if (currentTask.type === 'monitoring') {
      getDocs(collection(db, 'companies', companyCode, 'monitoringTasks')).then(snap => {
        setMonitoringList(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, description: doc.data().description || '' })));
      });
    }
  }, [companyCode, dialogOpen, currentTask.type]);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Tasks</Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>Add Task</Button>
        )}
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
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
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
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
                  <Chip label={types.find(t => t.value === task.type)?.label || task.type} color={typeColors[task.type] || 'default'} size="small" />
                </TableCell>
                <TableCell>{task.department}</TableCell>
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
      </Paper>
      {/* Create/Edit Task Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Task' : 'Add Task'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={currentTask.type || ''}
              label="Type"
              onChange={e => setCurrentTask(t => ({ ...t, type: e.target.value, linkedItemId: '', linkedItemTitle: '', title: '', description: '' }))}
            >
              {types.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Linked Item Dropdown - immediately after Type */}
          {currentTask.type === 'sop' ? (
            <FormControl fullWidth>
              <InputLabel>Select SOP</InputLabel>
              <Select
                value={currentTask.linkedItemId || ''}
                label="Select SOP"
                onChange={e => {
                  const sop = sopList.find(s => s.id === e.target.value);
                  setCurrentTask(t => ({
                    ...t,
                    linkedItemId: sop?.id,
                    linkedItemTitle: sop?.title,
                    title: sop?.title || '',
                    description: sop?.description || '',
                  }));
                }}
              >
                {sopList.map(sop => <MenuItem key={sop.id} value={sop.id}>{sop.title}</MenuItem>)}
              </Select>
            </FormControl>
          ) : currentTask.type === 'monitoring' ? (
            <FormControl fullWidth>
              <InputLabel>Select Monitoring Task</InputLabel>
              <Select
                value={currentTask.linkedItemId || ''}
                label="Select Monitoring Task"
                onChange={e => {
                  const mon = monitoringList.find(m => m.id === e.target.value);
                  setCurrentTask(t => ({
                    ...t,
                    linkedItemId: mon?.id,
                    linkedItemTitle: mon?.name,
                    title: mon?.name || '',
                    description: mon?.description || '',
                  }));
                }}
              >
                {monitoringList.map(mon => <MenuItem key={mon.id} value={mon.id}>{mon.name}</MenuItem>)}
              </Select>
            </FormControl>
          ) : null}
          {/* Always show Title input, editable */}
          <TextField
            label="Title"
            value={currentTask.title || ''}
            onChange={e => setCurrentTask(t => ({ ...t, title: e.target.value }))}
            fullWidth
            required
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
            <InputLabel>Department</InputLabel>
            <Select
              value={currentTask.department || ''}
              label="Department"
              onChange={e => setCurrentTask(t => ({ ...t, department: e.target.value }))}
            >
              {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
            </Select>
          </FormControl>
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
            label="Due Date"
            type="date"
            value={currentTask.dueDate || ''}
            onChange={e => setCurrentTask(t => ({ ...t, dueDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Assign to Roles</InputLabel>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !currentTask.title || !currentTask.type}>{saving ? 'Saving...' : (editMode ? 'Save' : 'Add')}</Button>
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