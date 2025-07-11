import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, collectionGroup, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import SOPSelectDialog, { SOP as SOPType } from '../components/SOPSelect/SOPSelectDialog';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Stack from '@mui/material/Stack';

const RESPONSIBILITIES = ['Production Staff', 'Management'];
const FREQUENCIES = ['Once a day', 'Once a week', 'Once a month', 'One-time task'];

const FIELD_TYPES = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'amount', label: 'Amount' },
  { value: 'text', label: 'Text' },
  { value: 'numeric', label: 'Numeric Value' },
  { value: 'multi', label: 'Multiple Answers' },
  { value: 'single', label: 'One Answer' },
  { value: 'product', label: 'Product' },
  { value: 'location', label: 'Location' },
];

export default function Monitoring() {
  const [filter, setFilter] = useState('active');
  const [tasks, setTasks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newTask, setNewTask] = useState({ name: '', responsibility: RESPONSIBILITIES[0], inUse: true });
  const [taskType, setTaskType] = useState<'detailed' | 'checklist'>('detailed');
  const [details, setDetails] = useState({ frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
  const [checklist, setChecklist] = useState([{ title: '', allowNotDone: false }]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);

  // --- Detail Task Fields State ---
  const [fields, setFields] = useState<any[]>([]);

  const handleAddField = () => {
    setFields(prev => [
      ...prev,
      { id: Date.now(), type: '', label: '', config: {} }
    ]);
  };
  const handleRemoveField = (id: number) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };
  const handleFieldChange = (id: number, key: string, value: any) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };
  const moveField = (from: number, to: number) => {
    setFields(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  // --- Location Data State ---
  const [areas, setAreas] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

  // --- SOP Data State ---
  const [sops, setSops] = useState<{ id: string; title: string; description: string; version?: string }[]>([]);
  const [selectedSops, setSelectedSops] = useState<string[]>([]);

  // Add state for SOP select dialog and selected instruction SOP
  const [sopDialogOpen, setSopDialogOpen] = useState(false);
  // Replace instructionSOP with instructionSOPs (array)
  const [instructionSOPs, setInstructionSOPs] = useState<SOPType[]>([]);

  // Add state for one-time date and time
  const [oneTimeDate, setOneTimeDate] = useState('');
  const [oneTimeTime, setOneTimeTime] = useState('');

  // Fetch Areas, Rooms, Equipment when companyCode changes
  useEffect(() => {
    if (!companyCode) return;
    const fetchLocations = async () => {
      try {
        const areasSnap = await getDocs(collection(db, 'companies', companyCode, 'areas'));
        setAreas(areasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const roomsSnap = await getDocs(collection(db, 'companies', companyCode, 'rooms'));
        setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const equipmentSnap = await getDocs(collection(db, 'companies', companyCode, 'equipment'));
        setEquipment(equipmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, [companyCode]);

  // Fetch SOPs when companyCode changes
  useEffect(() => {
    if (!companyCode) return;
    const fetchSOPs = async () => {
      try {
        const sopsSnap = await getDocs(collection(db, 'companies', companyCode, 'sops'));
        setSops(sopsSnap.docs.map(doc => ({ 
          id: doc.id, 
          title: doc.data().title, 
          description: doc.data().description || '',
          version: doc.data().version || ''
        })));
      } catch (error) {
        console.error('Error fetching SOPs:', error);
      }
    };
    fetchSOPs();
  }, [companyCode]);

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
    const taskData = { 
      ...newTask, 
      type: taskType, 
      details: {
        ...details,
        oneTimeDate: details.frequency === 'One-time task' ? oneTimeDate : undefined,
        oneTimeTime: details.frequency === 'One-time task' ? oneTimeTime : undefined,
      },
      checklist,
      fields, // Include the dynamic fields
      instructionSOPs: instructionSOPs.map(sop => ({ id: sop.id, title: sop.title, version: sop.version })),
    };
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
    setNewTask({ name: '', responsibility: RESPONSIBILITIES[0], inUse: true });
    setTaskType('detailed');
    setDetails({ frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
    setChecklist([{ title: '', allowNotDone: false }]);
    setFields([]); // Reset fields
    setInstructionSOPs([]); // Reset instruction SOPs
    setOneTimeDate(''); // Reset one-time date
    setOneTimeTime(''); // Reset one-time time
  };
  const handleChecklistChange = (idx: number, field: string, value: any) => {
    setChecklist(list => list.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAddChecklist = () => {
    setChecklist(list => [...list, { title: '', allowNotDone: false }]);
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
        <DialogTitle>Add Detail Task</DialogTitle>
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
              {RESPONSIBILITIES.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
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
        <DialogTitle>Add Detail Task</DialogTitle>
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
        <DialogTitle>Add Detail Task</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 1 }}>Task name</Typography>
            <TextField value={newTask.name} fullWidth InputProps={{ readOnly: true }} />
            <Button
              sx={{ mt: 1, color: '#27ae60', fontWeight: 600 }}
              startIcon={<span role="img" aria-label="instructions">📋</span>}
              onClick={() => setSopDialogOpen(true)}
            >
              {instructionSOPs.length > 0 ? 'EDIT INSTRUCTIONS' : 'ADD INSTRUCTIONS'}
            </Button>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 1 }}>
              {instructionSOPs.map(sop => (
                <Chip
                  key={sop.id}
                  label={sop.title + (sop.version ? ` (v${sop.version})` : '')}
                  onDelete={() => setInstructionSOPs(instructionSOPs.filter(s => s.id !== sop.id))}
                  sx={{ bgcolor: '#e8f5e8', color: '#2e7d32', fontWeight: 500 }}
                />
              ))}
            </Box>
            <SOPSelectDialog
              open={sopDialogOpen}
              sops={sops}
              selected={instructionSOPs}
              onClose={() => setSopDialogOpen(false)}
              onSelect={sops => {
                setInstructionSOPs(sops);
                setSopDialogOpen(false);
              }}
            />
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
            {details.frequency === 'One-time task' && (
              <Box sx={{
                mt: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                bgcolor: '#fafbfc',
                boxShadow: 1,
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Set date and time for this one-time task
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    label={<span>Date <span style={{ color: '#d32f2f' }}>*</span></span>}
                    type="date"
                    value={oneTimeDate}
                    onChange={e => setOneTimeDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                    InputProps={{ startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: '#90caf9' }} /> }}
                  />
                  <TextField
                    label={<span>Time <span style={{ color: '#d32f2f' }}>*</span></span>}
                    type="time"
                    value={oneTimeTime}
                    onChange={e => setOneTimeTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                    InputProps={{ startAdornment: <AccessTimeIcon sx={{ mr: 1, color: '#90caf9' }} /> }}
                  />
                </Stack>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Assign task to</InputLabel>
                <Select
                  value={newTask.responsibility}
                  label="Assign task to"
                  onChange={e => setNewTask(t => ({ ...t, responsibility: e.target.value }))}
                >
                  {RESPONSIBILITIES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Checkbox checked={details.sameRole} onChange={e => setDetails(d => ({ ...d, sameRole: e.target.checked }))} />
                <Typography>Use same role for all tasks</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Detail tasks</Typography>
            {checklist.map((item, idx) => (
              <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Checklist task title"
                  value={item.title}
                  onChange={e => handleChecklistChange(idx, 'title', e.target.value)}
                  fullWidth
                />
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
          {/* SOP Linking Section */}
          {/* Removed Linked SOPs section */}
          <Box sx={{ p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc', mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Detail Task Fields</Typography>
            {fields.map((field, idx) => (
              <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, position: 'relative', bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IconButton size="small" disabled={idx === 0} onClick={() => moveField(idx, idx - 1)}><DragIndicatorIcon /></IconButton>
                  <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
                    <InputLabel>Field Type</InputLabel>
                    <Select
                      value={field.type}
                      label="Field Type"
                      onChange={e => handleFieldChange(field.id, 'type', e.target.value)}
                    >
                      {FIELD_TYPES.map(ft => (
                        <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Field Label"
                    value={field.label}
                    onChange={e => handleFieldChange(field.id, 'label', e.target.value)}
                    sx={{ flex: 1, mr: 2 }}
                  />
                  <IconButton color="error" onClick={() => handleRemoveField(field.id)}><span role="img" aria-label="delete">🗑️</span></IconButton>
                </Box>
                {/* Render field config based on type */}
                {field.type === 'temperature' && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Minimum"
                      type="number"
                      value={field.config.min || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, min: e.target.value })}
                      InputProps={{ endAdornment: <span>°F</span> }}
                    />
                    <TextField
                      size="small"
                      label="Maximum"
                      type="number"
                      value={field.config.max || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, max: e.target.value })}
                      InputProps={{ endAdornment: <span>°F</span> }}
                    />
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={field.config.unit || '°F'}
                        label="Unit"
                        onChange={e => handleFieldChange(field.id, 'config', { ...field.config, unit: e.target.value })}
                      >
                        <MenuItem value="°F">°F</MenuItem>
                        <MenuItem value="°C">°C</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
                {['amount', 'numeric'].includes(field.type) && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Minimum"
                      type="number"
                      value={field.config.min || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, min: e.target.value })}
                    />
                    <TextField
                      size="small"
                      label="Maximum"
                      type="number"
                      value={field.config.max || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, max: e.target.value })}
                    />
                    <TextField
                      size="small"
                      label="Unit"
                      value={field.config.unit || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, unit: e.target.value })}
                    />
                  </Box>
                )}
                {['date', 'time'].includes(field.type) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>No additional config for {field.type}.</Typography>
                  </Box>
                )}
                {field.type === 'text' && (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      label="Placeholder"
                      value={field.config.placeholder || ''}
                      onChange={e => handleFieldChange(field.id, 'config', { ...field.config, placeholder: e.target.value })}
                      fullWidth
                    />
                  </Box>
                )}
                {['multi', 'single'].includes(field.type) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Options</Typography>
                    {(field.config.options || ['']).map((opt: string, i: number) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          size="small"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...(field.config.options || [''])];
                            newOpts[i] = e.target.value;
                            handleFieldChange(field.id, 'config', { ...field.config, options: newOpts });
                          }}
                          sx={{ flex: 1, mr: 1 }}
                        />
                        <IconButton size="small" color="error" onClick={() => {
                          const newOpts = [...(field.config.options || [''])];
                          newOpts.splice(i, 1);
                          handleFieldChange(field.id, 'config', { ...field.config, options: newOpts });
                        }} disabled={(field.config.options || ['']).length === 1}>
                          <span role="img" aria-label="delete">🗑️</span>
                        </IconButton>
                      </Box>
                    ))}
                    <Button size="small" onClick={() => handleFieldChange(field.id, 'config', { ...field.config, options: [...(field.config.options || ['']), ''] })}>+ Add Option</Button>
                  </Box>
                )}
                {field.type === 'product' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#888' }}>Product selection coming soon.</Typography>
                  </Box>
                )}
                {field.type === 'location' && (
                  <Box sx={{ mb: 2 }}>
                    <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Location Type</InputLabel>
                      <Select
                        value={field.config.locationType || ''}
                        label="Location Type"
                        onChange={e => handleFieldChange(field.id, 'config', { ...field.config, locationType: e.target.value, locationId: '', locationName: '' })}
                      >
                        <MenuItem value="area">Area</MenuItem>
                        <MenuItem value="room">Room</MenuItem>
                        <MenuItem value="equipment">Equipment</MenuItem>
                      </Select>
                    </FormControl>
                    {field.config.locationType && (
                      <FormControl size="small" fullWidth>
                        <InputLabel>Select {field.config.locationType.charAt(0).toUpperCase() + field.config.locationType.slice(1)}</InputLabel>
                        <Select
                          value={field.config.locationId || ''}
                          label={`Select ${field.config.locationType}`}
                          onChange={e => {
                            let selectedName = '';
                            if (field.config.locationType === 'area') {
                              const found = areas.find(a => a.id === e.target.value);
                              selectedName = found ? found.name : '';
                            } else if (field.config.locationType === 'room') {
                              const found = rooms.find(r => r.id === e.target.value);
                              selectedName = found ? found.name : '';
                            } else if (field.config.locationType === 'equipment') {
                              const found = equipment.find(eq => eq.id === e.target.value);
                              selectedName = found ? found.name : '';
                            }
                            handleFieldChange(field.id, 'config', { ...field.config, locationId: e.target.value, locationName: selectedName });
                          }}
                        >
                          {(field.config.locationType === 'area' ? areas : field.config.locationType === 'room' ? rooms : equipment).map((loc: any) => (
                            <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                )}
                {/* Required checkbox for all */}
                <Box sx={{ mb: 1 }}>
                  <FormControl size="small">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={!!field.config.required}
                        onChange={e => handleFieldChange(field.id, 'config', { ...field.config, required: e.target.checked })}
                      />
                      <Typography>Required</Typography>
                    </Box>
                  </FormControl>
                </Box>
              </Box>
            ))}
            <Button variant="outlined" onClick={handleAddField} sx={{ mt: 2 }}>+ Add Field</Button>
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
              setDetails({ frequency: FREQUENCIES[0], sameFrequency: true, sameRole: true });
              setChecklist(selectedTask.checklist || [{ title: '', allowNotDone: false }]);
              setFields(selectedTask.fields || []); // Set fields for editing
              setInstructionSOPs(selectedTask.instructionSOPs || []); // Set instruction SOPs for editing
              setOneTimeDate(selectedTask.details?.oneTimeDate || '');
              setOneTimeTime(selectedTask.details?.oneTimeTime || '');
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