import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Divider } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, collectionGroup, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import SOPSelectDialog, { SOP as SOPType } from '../components/SOPSelect/SOPSelectDialog';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

const RESPONSIBILITIES = ['Production Staff', 'Management'];
const FREQUENCIES = ['Once a day', 'Once a week', 'Once a month', 'One-time task'];

const FIELD_TYPES = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'amount', label: 'Amount' },
  { value: 'text', label: 'Text' },
  { value: 'numeric', label: 'Numeric Value' },
  { value: 'multi', label: 'Multiple Answers' },
  { value: 'single', label: 'One Answer' },
  { value: 'product', label: 'Product' },
  { value: 'location', label: 'Location' },
  { value: 'media', label: 'Media Attachment' },
];

export default function Monitoring() {
  const [filter, setFilter] = useState('active');
  const [tasks, setTasks] = useState<any[]>([]);
  // Filter states
  const [inUseFilter, setInUseFilter] = useState('all'); // all, active, inactive
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [newTask, setNewTask] = useState({ name: '', responsibility: RESPONSIBILITIES[0], inUse: true });
  const [taskType, setTaskType] = useState<'detailed' | 'checklist'>('detailed');
  const [details, setDetails] = useState({ frequency: FREQUENCIES[0], oneTimeDate: '', oneTimeTime: '', startTime: '' });
  const [checklist, setChecklist] = useState([{ title: '', allowNotDone: false, locationType: '', locationId: '', locationName: '' }]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);

  // --- Detail Task Fields State ---
  const [fields, setFields] = useState<any[]>([]);

  // When adding a new field, set default type to the first FIELD_TYPES value
  const handleAddField = () => {
    setFields(prev => [
      ...prev,
      { id: Date.now(), type: FIELD_TYPES[0].value, label: '', config: {} }
    ]);
  };
  const handleRemoveField = (id: number) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };
  // When changing the field type, reset config
  const handleFieldChange = (id: number, key: string, value: any) => {
    setFields(prev => prev.map(f => {
      if (f.id === id) {
        if (key === 'type') {
          return { ...f, type: value, config: {} };
        }
        return { ...f, [key]: value };
      }
      return f;
    }));
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

  // Add state for startTime
  const [startTime, setStartTime] = useState('');

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
    if (!companyCode) {
      alert('Error: Company code not found. Please refresh the page.');
      return;
    }

    // Validation
    if (!newTask.name.trim()) {
      alert('Please enter a task name.');
      return;
    }

    if (taskType === 'checklist' && checklist.length === 0) {
      alert('Please add at least one checklist item.');
      return;
    }

    if (taskType === 'detailed' && fields.length === 0) {
      alert('Please add at least one field to the detailed task.');
      return;
    }

    if (details.frequency === 'One-time task' && (!oneTimeDate || !oneTimeTime)) {
      alert('Please set both date and time for the one-time task.');
      return;
    }

    // Prepare task data with timestamps
    const taskData = { 
      ...newTask, 
      type: taskType, 
      details: {
        ...details,
        ...(details.frequency === 'One-time task'
          ? { oneTimeDate, oneTimeTime }
          : { startTime }),
      },
      ...(taskType === 'checklist' ? { checklist } : {}),
      ...(taskType === 'detailed' ? { fields } : {}),
      instructionSOPs: instructionSOPs.map(sop => ({ id: sop.id, title: sop.title, version: sop.version })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.uid || auth.currentUser?.uid,
    };

    try {
      if (editMode && selectedTask?.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'monitoringTasks', selectedTask.id), {
          ...taskData,
          updatedAt: new Date().toISOString(),
        });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...taskData } : t));
        alert('Task updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'monitoringTasks'), taskData);
        setTasks(prev => [{ ...taskData, id: docRef.id }, ...prev]);
        alert('Task created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert('Error saving task: ' + (error.message || 'Unknown error occurred'));
      return;
    }

    // Reset form
    setDialogOpen(false);
    setStep(1);
    setEditMode(false);
    setSelectedTask(null);
    setNewTask({ name: '', responsibility: RESPONSIBILITIES[0], inUse: true });
    setTaskType('detailed');
    setDetails({ frequency: FREQUENCIES[0], oneTimeDate: '', oneTimeTime: '', startTime: '' });
    setChecklist([{ title: '', allowNotDone: false, locationType: '', locationId: '', locationName: '' }]);
    setFields([]); // Reset fields
    setInstructionSOPs([]); // Reset instruction SOPs
    setOneTimeDate(''); // Reset one-time date
    setOneTimeTime(''); // Reset one-time time
    setStartTime(''); // Reset start time
  };
  const handleChecklistChange = (idx: number, field: string, value: any) => {
    setChecklist(list => list.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAddChecklist = () => {
    setChecklist(list => [...list, { title: '', allowNotDone: false, locationType: '', locationId: '', locationName: '' }]);
  };
  const handleRemoveChecklist = (idx: number) => {
    setChecklist(list => list.filter((_, i) => i !== idx));
  };

  const steps = [
    'Task Type',
    'Task Details',
    'Review & Save',
  ];

  // Get unique roles from tasks
  const uniqueRoles = Array.from(new Set(tasks.map(t => t.responsibility).filter(Boolean)));

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    // In Use filter
    if (inUseFilter === 'active' && !task.inUse) return false;
    if (inUseFilter === 'inactive' && task.inUse) return false;
    // Role filter
    if (roleFilter !== 'all' && task.responsibility !== roleFilter) return false;
    // Type filter
    if (typeFilter !== 'all' && task.type !== typeFilter) return false;
    // Search filter
    if (searchFilter && !task.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>In Use</InputLabel>
          <Select
            value={inUseFilter}
            label="In Use"
            onChange={e => setInUseFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={e => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {uniqueRoles.map(role => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Task Type</InputLabel>
          <Select
            value={typeFilter}
            label="Task Type"
            onChange={e => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="detailed">Detailed Task</MenuItem>
            <MenuItem value="checklist">Checklist</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Search by Name"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setInUseFilter('all');
            setRoleFilter('all');
            setTypeFilter('all');
            setSearchFilter('');
          }}
        >
          Clear Filters
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Monitoring tasks</Typography>
        <Button variant="contained" color="success" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }} onClick={() => { setDialogOpen(true); setStep(1); }}>
          Add monitoring task
        </Button>
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
            {filteredTasks.map((task, idx) => (
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Monitoring Task</DialogTitle>
        <DialogContent>
          <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 3 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
            </Box>
          )}
          {step === 2 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc', border: '1px solid #e0e0e0' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Task details</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <TextField
                    label={<span>Task name <span style={{ color: '#d32f2f' }}>*</span></span>}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <Typography>In use</Typography>
                    <Switch
                      checked={newTask.inUse}
                      onChange={e => setNewTask(t => ({ ...t, inUse: e.target.checked }))}
                      color="success"
                    />
                  </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
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
                  {details.frequency !== 'One-time task' && (
                    <TextField
                      label="Start Time"
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      sx={{ minWidth: 180 }}
                    />
                  )}
                </Stack>
                {details.frequency === 'One-time task' && (
                  <Box sx={{
                    mt: 2,
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    bgcolor: '#fff',
                    boxShadow: 0,
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
              </Box>
              <Box sx={{ mb: 3 }}>
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
              {taskType === 'checklist' ? (
                <Box sx={{ p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Checklist Items</Typography>
                  {checklist.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Checklist task title"
                        value={item.title}
                        onChange={e => handleChecklistChange(idx, 'title', e.target.value)}
                        fullWidth
                        sx={{ minWidth: 180 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Location Type</InputLabel>
                        <Select
                          value={item.locationType || ''}
                          label="Location Type"
                          onChange={e => handleChecklistChange(idx, 'locationType', e.target.value)}
                        >
                          <MenuItem value="area">Area</MenuItem>
                          <MenuItem value="room">Room</MenuItem>
                          <MenuItem value="equipment">Equipment</MenuItem>
                        </Select>
                      </FormControl>
                      {item.locationType && (
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <InputLabel>Select {item.locationType.charAt(0).toUpperCase() + item.locationType.slice(1)}</InputLabel>
                          <Select
                            value={item.locationId || ''}
                            label={`Select ${item.locationType}`}
                            onChange={e => {
                              let selectedName = '';
                              if (item.locationType === 'area') {
                                const found = areas.find(a => a.id === e.target.value);
                                selectedName = found ? found.name : '';
                              } else if (item.locationType === 'room') {
                                const found = rooms.find(r => r.id === e.target.value);
                                selectedName = found ? found.name : '';
                              } else if (item.locationType === 'equipment') {
                                const found = equipment.find(eq => eq.id === e.target.value);
                                selectedName = found ? found.name : '';
                              }
                              handleChecklistChange(idx, 'locationId', e.target.value);
                              handleChecklistChange(idx, 'locationName', selectedName);
                            }}
                          >
                            {(item.locationType === 'area' ? areas : item.locationType === 'room' ? rooms : equipment).map((loc: any) => (
                              <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
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
              ) : (
                <Box sx={{ p: 2, borderRadius: 3, boxShadow: 1, bgcolor: '#fafbfc' }}>
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
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.config.required || false}
                              onChange={e => handleFieldChange(field.id, 'config', { ...field.config, required: e.target.checked })}
                              size="small"
                            />
                          }
                          label="Required"
                          sx={{ mr: 2 }}
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
                      {field.type === 'amount' && (
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
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Unit</InputLabel>
                            <Select
                              value={field.config.unit || 'gram'}
                              label="Unit"
                              onChange={e => handleFieldChange(field.id, 'config', { ...field.config, unit: e.target.value })}
                            >
                              <MenuItem value="gram">Gram (g)</MenuItem>
                              <MenuItem value="kilogram">Kilogram (kg)</MenuItem>
                              <MenuItem value="milliliter">Milliliter (ml)</MenuItem>
                              <MenuItem value="liter">Liter (l)</MenuItem>
                              <MenuItem value="piece">Piece (pc)</MenuItem>
                              <MenuItem value="other">Other</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                      {field.type === 'text' && (
                        <Box sx={{ mb: 2 }}>
                          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Text Type</InputLabel>
                            <Select
                              value={field.config.textType || 'single'}
                              label="Text Type"
                              onChange={e => handleFieldChange(field.id, 'config', { ...field.config, textType: e.target.value })}
                            >
                              <MenuItem value="single">Single Line</MenuItem>
                              <MenuItem value="multiline">Multi-line</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            size="small"
                            label="Character Limit"
                            type="number"
                            value={field.config.maxLength || ''}
                            onChange={e => handleFieldChange(field.id, 'config', { ...field.config, maxLength: e.target.value })}
                            InputProps={{ endAdornment: <span>characters</span> }}
                            fullWidth
                          />
                        </Box>
                      )}
                      {field.type === 'numeric' && (
                        <Box sx={{ mb: 2 }}>
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
                              label="Decimal Places"
                              type="number"
                              inputProps={{ min: 0, max: 4 }}
                              value={field.config.decimalPlaces || 0}
                              onChange={e => {
                                let val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val < 0) val = 0;
                                if (val > 4) val = 4;
                                handleFieldChange(field.id, 'config', { ...field.config, decimalPlaces: val });
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                      {field.type === 'media' && (
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            label="Max number of photos"
                            type="number"
                            inputProps={{ min: 1, max: 5 }}
                            value={field.config.maxPhotos || 1}
                            onChange={e => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 1) val = 1;
                              if (val > 5) val = 5;
                              handleFieldChange(field.id, 'config', { ...field.config, maxPhotos: val });
                            }}
                            fullWidth
                            size="small"
                          />
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
                              <InputLabel>{`Select ${field.config.locationType.charAt(0).toUpperCase() + field.config.locationType.slice(1)}`}</InputLabel>
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
                      {field.type === 'single' && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Option</Typography>
                          <TextField
                            size="small"
                            value={field.config.options ? field.config.options[0] || '' : ''}
                            onChange={e => handleFieldChange(field.id, 'config', { ...field.config, options: [e.target.value] })}
                            sx={{ flex: 1, mr: 1 }}
                          />
                        </Box>
                      )}
                      {field.type === 'multi' && (
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
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Product Selection</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Products will be fetched from your company's product catalog
                          </Typography>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Allow Multiple Selection</InputLabel>
                            <Select
                              value={field.config.allowMultiple ? 'true' : 'false'}
                              label="Allow Multiple Selection"
                              onChange={e => handleFieldChange(field.id, 'config', { ...field.config, allowMultiple: e.target.value === 'true' })}
                            >
                              <MenuItem value="false">Single Product</MenuItem>
                              <MenuItem value="true">Multiple Products</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </Box>
                  ))}
                  <Button variant="outlined" onClick={handleAddField} sx={{ mt: 2 }}>+ Add Field</Button>
                </Box>
              )}
            </Box>
          )}
          {step === 3 && (
            <Box sx={{ mt: 1, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Review & Save</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Task Name:</Typography>
                <Typography sx={{ mb: 1 }}>{newTask.name}</Typography>
                <Typography variant="subtitle2">Type:</Typography>
                <Typography sx={{ mb: 1 }}>{taskType === 'detailed' ? 'Detailed Task' : 'Checklist'}</Typography>
                <Typography variant="subtitle2">Responsible Role:</Typography>
                <Typography sx={{ mb: 1 }}>{newTask.responsibility}</Typography>
                <Typography variant="subtitle2">In Use:</Typography>
                <Typography sx={{ mb: 1 }}>{newTask.inUse ? 'Yes' : 'No'}</Typography>
                <Typography variant="subtitle2">Frequency:</Typography>
                <Typography sx={{ mb: 1 }}>{details.frequency}</Typography>
                {details.frequency === 'One-time task' && (
                  <>
                    <Typography variant="subtitle2">Date:</Typography>
                    <Typography sx={{ mb: 1 }}>{oneTimeDate}</Typography>
                    <Typography variant="subtitle2">Time:</Typography>
                    <Typography sx={{ mb: 1 }}>{oneTimeTime}</Typography>
                  </>
                )}
                <Typography variant="subtitle2">Start Time:</Typography>
                <Typography sx={{ mb: 1 }}>{details.frequency !== 'One-time task' ? startTime : 'N/A'}</Typography>
                <Typography variant="subtitle2">Instructions/SOPs:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {instructionSOPs.length === 0 ? <Typography color="text.secondary">None</Typography> : instructionSOPs.map(sop => (
                    <Chip key={sop.id} label={sop.title + (sop.version ? ` (v${sop.version})` : '')} />
                  ))}
                </Box>
                {taskType === 'checklist' ? (
                  <>
                    <Typography variant="subtitle2">Checklist Items:</Typography>
                    {checklist.length === 0 ? <Typography color="text.secondary">None</Typography> : checklist.map((item, idx) => (
                      <Typography key={idx} sx={{ ml: 2 }}>• {item.title}</Typography>
                    ))}
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2">Detail Task Fields:</Typography>
                    {fields.length === 0 ? <Typography color="text.secondary">None</Typography> : fields.map((field, idx) => (
                      <Typography key={idx} sx={{ ml: 2 }}>• {field.label} ({field.type})</Typography>
                    ))}
                  </>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {step === 1 && (
            <>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleNext} variant="contained" disabled={!taskType}>Next</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} variant="contained" disabled={!newTask.name.trim()}>Next</Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={handleSave} variant="contained">Save</Button>
            </>
          )}
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
            sx={{ mb: 2 }}
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
              setDetails({ frequency: FREQUENCIES[0], oneTimeDate: '', oneTimeTime: '', startTime: '' });
              setChecklist(selectedTask.checklist || [{ title: '', allowNotDone: false, locationType: '', locationId: '', locationName: '' }]);
              setFields(selectedTask.fields || []); // Set fields for editing
              setInstructionSOPs(selectedTask.instructionSOPs || []); // Set instruction SOPs for editing
              setOneTimeDate(selectedTask.details?.oneTimeDate || '');
              setOneTimeTime(selectedTask.details?.oneTimeTime || '');
              setStartTime(selectedTask.details?.startTime || '');
              setActionModalOpen(false);
            }}
          >
            Edit
          </Button>
          <Button
            color="secondary"
            variant="outlined"
            fullWidth
            onClick={async () => {
              if (!selectedTask || !companyCode) return;
              try {
                // Prepare duplicate data
                const duplicate = {
                  ...selectedTask,
                  name: `${selectedTask.name} (Copy)` || 'Untitled (Copy)',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: currentUser?.uid || auth.currentUser?.uid,
                };
                // Remove id from duplicate
                delete duplicate.id;
                // Remove any undefined fields (especially checklist/fields)
                if (!duplicate.fields) delete duplicate.fields;
                if (!duplicate.checklist) delete duplicate.checklist;
                // Save to Firebase
                const docRef = await addDoc(collection(db, 'companies', companyCode, 'monitoringTasks'), duplicate);
                setTasks(prev => [{ ...duplicate, id: docRef.id }, ...prev]);
                alert('Task duplicated successfully!');
                setActionModalOpen(false);
              } catch (error) {
                let msg = 'Unknown error';
                if (error instanceof Error) msg = error.message;
                alert('Error duplicating task: ' + msg);
              }
            }}
          >
            Duplicate
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 