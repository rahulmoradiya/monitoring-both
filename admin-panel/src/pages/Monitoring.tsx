import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, collectionGroup, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

const FREQUENCIES = ['Once a day', 'Once a week', 'Once a month'];

export default function Monitoring() {
  const [filter, setFilter] = useState('active');
  const [tasks, setTasks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newTask, setNewTask] = useState({ name: '', responsibility: '', inUse: true });
  const [taskType, setTaskType] = useState<'detailed' | 'checklist'>('detailed');
  const [details, setDetails] = useState({ frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
  const [checklist, setChecklist] = useState([
    { title: '', allowNotDone: false, areaId: '', roomId: '', equipmentId: '' }
  ]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [equipment, setEquipment] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch current user and companyCode
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setCurrentUser(userDoc.data());
          setCompanyCode(userDoc.data().companyCode);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!companyCode) return;
    // Fetch roles for the current company
    const fetchRoles = async () => {
      const rolesSnap = await getDocs(collection(db, 'companies', companyCode, 'roles'));
      const rolesList = rolesSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
      }));
      setRoles(rolesList);
    };
    fetchRoles();
    // Fetch areas, rooms, equipment
    const fetchLayout = async () => {
      const [areasSnap, roomsSnap, equipmentSnap] = await Promise.all([
        getDocs(collection(db, 'companies', companyCode, 'areas')),
        getDocs(collection(db, 'companies', companyCode, 'rooms')),
        getDocs(collection(db, 'companies', companyCode, 'equipment')),
      ]);
      setAreas(areasSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || '' })));
      setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || '' })));
      setEquipment(equipmentSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name || '' })));
    };
    fetchLayout();
  }, [companyCode]);

  useEffect(() => {
    if (!companyCode) return;
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'companies', companyCode, 'monitoringTasks'));
        const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, [companyCode]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  const handleSave = async () => {
    if (!companyCode) return;
    const taskData = { ...newTask, type: taskType, details, checklist };
    try {
      if (editMode && selectedTask?.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'monitoringTasks', selectedTask.id), taskData);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...taskData } : t));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'monitoringTasks'), taskData);
        setTasks(prev => [{ ...taskData, id: docRef.id }, ...prev]);
      }
      alert('Task saved to Firebase!');
    } catch (error: any) {
      alert('Error saving task: ' + error.message);
    }
    setDialogOpen(false);
    setStep(1);
    setNewTask({ name: '', responsibility: '', inUse: true });
    setTaskType('detailed');
    setDetails({ frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
    setChecklist([{ title: '', allowNotDone: false, areaId: '', roomId: '', equipmentId: '' }]);
    setEditMode(false);
    setSelectedTask(null);
  };
  const handleChecklistChange = (idx: number, field: string, value: any) => {
    setChecklist(list => list.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAddChecklist = () => {
    setChecklist(list => [...list, { title: '', allowNotDone: false, areaId: '', roomId: '', equipmentId: '' }]);
  };
  const handleRemoveChecklist = (idx: number) => {
    setChecklist(list => list.filter((_, i) => i !== idx));
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Monitoring tasks</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" color="success" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }} onClick={() => { setDialogOpen(true); setStep(1); }}>
            Add monitoring task
          </Button>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Active tasks</InputLabel>
            <Select
              value={filter}
              label="Active tasks"
              onChange={e => setFilter(e.target.value)}
            >
              <MenuItem value="active">Active tasks</MenuItem>
              <MenuItem value="inactive">Inactive tasks</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Monitoring tasks</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Responsible role</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>In use</TableCell>
              <TableCell align="right" sx={{ width: 48 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task, idx) => (
              <TableRow key={task.id || idx} hover>
                <TableCell sx={{ fontWeight: 500, fontSize: '1.1rem' }}>{task.name}</TableCell>
                <TableCell>
                  <Chip label={task.responsibility} color="default" sx={{ fontWeight: 600, fontSize: '0.95rem' }} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={task.inUse}
                    color="success"
                    onChange={async (e) => {
                      const newInUse = e.target.checked;
                      if (!task.id || !companyCode) return;
                      try {
                        await updateDoc(doc(db, 'companies', companyCode, 'monitoringTasks', task.id), { inUse: newInUse });
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, inUse: newInUse } : t));
                      } catch (error) {
                        alert('Error updating status: ' + (error as any).message);
                      }
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setSelectedTask(task); setActionModalOpen(true); }}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Add Monitoring Task Dialog - Step 1 */}
      <Dialog open={dialogOpen && step === 1} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Monitoring Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Task name"
            value={newTask.name}
            onChange={e => setNewTask(t => ({ ...t, name: e.target.value }))}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Responsible role</InputLabel>
            <Select
              value={newTask.responsibility}
              label="Responsible role"
              onChange={e => setNewTask(t => ({ ...t, responsibility: e.target.value }))}
            >
              {roles.map(role => (
                <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>In use</Typography>
            <Switch
              checked={newTask.inUse}
              onChange={e => setNewTask(t => ({ ...t, inUse: e.target.checked }))}
              color="success"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleNext} variant="contained" disabled={!newTask.name.trim()}>Next</Button>
        </DialogActions>
      </Dialog>
      {/* Add Monitoring Task Dialog - Step 2 */}
      <Dialog open={dialogOpen && step === 2} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Monitoring Task</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography sx={{ mb: 2 }}>This task is a</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              onClick={() => setTaskType('detailed')}
              sx={{
                flex: 1,
                border: taskType === 'detailed' ? '2px solid #27ae60' : '2px solid #eee',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                background: taskType === 'detailed' ? '#f6fff8' : '#fff',
                boxShadow: taskType === 'detailed' ? '0 0 0 2px #27ae6033' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #27ae60', background: taskType === 'detailed' ? '#27ae60' : '#fff', mr: 1, display: 'inline-block' }} />
                <Typography sx={{ fontWeight: 700 }}>A detailed task</Typography>
              </Box>
              <Typography sx={{ color: '#444', fontSize: '0.98rem' }}>
                can be built using different input fields like temperature, date, weight, etc.
              </Typography>
            </Box>
            <Box
              onClick={() => setTaskType('checklist')}
              sx={{
                flex: 1,
                border: taskType === 'checklist' ? '2px solid #27ae60' : '2px solid #eee',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                background: taskType === 'checklist' ? '#f6fff8' : '#fff',
                boxShadow: taskType === 'checklist' ? '0 0 0 2px #27ae6033' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #27ae60', background: taskType === 'checklist' ? '#27ae60' : '#fff', mr: 1, display: 'inline-block' }} />
                <Typography sx={{ fontWeight: 700 }}>A checklist</Typography>
              </Box>
              <Typography sx={{ color: '#444', fontSize: '0.98rem' }}>
                is a list of tasks that users can check as done.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleBack}>Cancel</Button>
          <Button onClick={handleNext} variant="contained">Next</Button>
        </DialogActions>
      </Dialog>
      {/* Add Monitoring Task Dialog - Step 3 */}
      <Dialog open={dialogOpen && step === 3} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Monitoring Task</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 1 }}>Task name</Typography>
            <TextField value={newTask.name} fullWidth InputProps={{ readOnly: true }} />
            <Button sx={{ mt: 1, color: '#27ae60', fontWeight: 600 }} startIcon={<span role="img" aria-label="instructions">📋</span>}>
              ADD INSTRUCTIONS
            </Button>
          </Box>
          <Box sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Task details</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={details.frequency}
                  label="Frequency"
                  onChange={e => setDetails(d => ({ ...d, frequency: e.target.value }))}
                >
                  {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Checkbox checked={details.sameFrequency} onChange={e => setDetails(d => ({ ...d, sameFrequency: e.target.checked }))} />
                <Typography>Use same frequency for all tasks</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Assign task to</InputLabel>
                <Select
                  value={newTask.responsibility}
                  label="Assign task to"
                  onChange={e => setNewTask(t => ({ ...t, responsibility: e.target.value }))}
                >
                  {roles.map(role => <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Checkbox checked={details.sameRole} onChange={e => setDetails(d => ({ ...d, sameRole: e.target.checked }))} />
                <Typography>Use same role for all tasks</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Checklist tasks</Typography>
            {checklist.map((item, idx) => (
              <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Checklist task title"
                  value={item.title}
                  onChange={e => handleChecklistChange(idx, 'title', e.target.value)}
                  fullWidth
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Area</InputLabel>
                  <Select
                    value={item.areaId}
                    label="Area"
                    onChange={e => handleChecklistChange(idx, 'areaId', e.target.value)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {areas.map(area => <MenuItem key={area.id} value={area.id}>{area.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Room</InputLabel>
                  <Select
                    value={item.roomId}
                    label="Room"
                    onChange={e => handleChecklistChange(idx, 'roomId', e.target.value)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {rooms.map(room => <MenuItem key={room.id} value={room.id}>{room.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Equipment</InputLabel>
                  <Select
                    value={item.equipmentId}
                    label="Equipment"
                    onChange={e => handleChecklistChange(idx, 'equipmentId', e.target.value)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {equipment.map(eq => <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <IconButton color="error" onClick={() => handleRemoveChecklist(idx)} disabled={checklist.length === 1}>
                  <span role="img" aria-label="delete">🗑️</span>
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Checkbox
                    checked={item.allowNotDone}
                    onChange={e => handleChecklistChange(idx, 'allowNotDone', e.target.checked)}
                  />
                  <Typography>Allow to mark "not done"</Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton color="primary" onClick={handleAddChecklist}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>+</span>
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleBack}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Action Modal for Edit/Delete */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)}>
        <DialogTitle>Task Options</DialogTitle>
        <DialogContent>
          <Button
            color="error"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            onClick={async () => {
              if (selectedTask?.id && companyCode) {
                await deleteDoc(doc(db, 'companies', companyCode, 'monitoringTasks', selectedTask.id));
                setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
                setActionModalOpen(false);
              }
            }}
          >
            Delete
          </Button>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            onClick={() => {
              setEditMode(true);
              setDialogOpen(true);
              setStep(1);
              setNewTask({
                name: selectedTask.name,
                responsibility: selectedTask.responsibility,
                inUse: selectedTask.inUse,
              });
              setTaskType(selectedTask.type || 'detailed');
              setDetails(selectedTask.details || { frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
              setChecklist(selectedTask.checklist || [{ title: '', allowNotDone: false, areaId: '', roomId: '', equipmentId: '' }]);
              setActionModalOpen(false);
            }}
          >
            Edit
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 