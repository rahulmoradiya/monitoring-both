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
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  ListItemButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// Firebase imports
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, collectionGroup } from 'firebase/firestore';

interface Area {
  id: string;
  name: string;
  description?: string;
}

interface Room {
  id: string;
  name: string;
  description?: string;
}

interface Equipment {
  id: string;
  name: string;
  description?: string;
}

export default function Layout() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Area dialog state
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [areaEditMode, setAreaEditMode] = useState(false);
  const [currentArea, setCurrentArea] = useState<{ id?: string; name: string; description?: string }>({ name: '' });

  // Room dialog state
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ id?: string; name: string; description?: string }>({ name: '' });

  // Equipment dialog state
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentEditMode, setEquipmentEditMode] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<{ id?: string; name: string; description?: string }>({ name: '' });

  // Fetch companyCode from current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setCompanyCode(userDoc.data().companyCode);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch areas, rooms, equipment from Firestore
  useEffect(() => {
    if (!companyCode) return;
    setLoading(true);
    setError('');
    const fetchAll = async () => {
      try {
        const [areasSnap, roomsSnap, equipmentSnap] = await Promise.all([
          getDocs(collection(db, 'companies', companyCode, 'areas')),
          getDocs(collection(db, 'companies', companyCode, 'rooms')),
          getDocs(collection(db, 'companies', companyCode, 'equipment')),
        ]);
        setAreas(areasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Area)));
        setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
        setEquipment(equipmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment)));
      } catch (err) {
        setError('Failed to fetch layout data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [companyCode]);

  // Area dialog handlers
  const openAreaDialog = (item?: Area) => {
    setAreaEditMode(!!item);
    setCurrentArea(item ? { ...item } : { name: '' });
    setAreaDialogOpen(true);
  };
  const closeAreaDialog = () => {
    setAreaDialogOpen(false);
    setCurrentArea({ name: '' });
    setAreaEditMode(false);
  };
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentArea((prev) => ({ ...prev, [name]: value }));
  };
  const handleAreaSave = async () => {
    if (!currentArea.name || !companyCode) return;
    try {
      if (areaEditMode && currentArea.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'areas', currentArea.id), {
          name: currentArea.name,
          description: currentArea.description || '',
        });
        setAreas((prev) => prev.map((a) => (a.id === currentArea.id ? { ...a, ...currentArea } : a)));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'areas'), {
          name: currentArea.name,
          description: currentArea.description || '',
        });
        setAreas((prev) => [...prev, { id: docRef.id, name: currentArea.name, description: currentArea.description }]);
      }
      closeAreaDialog();
    } catch (err) {
      setError('Failed to save area.');
    }
  };
  const handleAreaRemove = async (id: string) => {
    if (!companyCode) return;
    try {
      await deleteDoc(doc(db, 'companies', companyCode, 'areas', id));
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError('Failed to delete area.');
    }
  };

  // Room dialog handlers
  const openRoomDialog = (item?: Room) => {
    setRoomEditMode(!!item);
    setCurrentRoom(item ? { ...item } : { name: '' });
    setRoomDialogOpen(true);
  };
  const closeRoomDialog = () => {
    setRoomDialogOpen(false);
    setCurrentRoom({ name: '' });
    setRoomEditMode(false);
  };
  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRoom((prev) => ({ ...prev, [name]: value }));
  };
  const handleRoomSave = async () => {
    if (!currentRoom.name || !companyCode) return;
    try {
      if (roomEditMode && currentRoom.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'rooms', currentRoom.id), {
          name: currentRoom.name,
          description: currentRoom.description || '',
        });
        setRooms((prev) => prev.map((r) => (r.id === currentRoom.id ? { ...r, ...currentRoom } : r)));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'rooms'), {
          name: currentRoom.name,
          description: currentRoom.description || '',
        });
        setRooms((prev) => [...prev, { id: docRef.id, name: currentRoom.name, description: currentRoom.description }]);
      }
      closeRoomDialog();
    } catch (err) {
      setError('Failed to save room.');
    }
  };
  const handleRoomRemove = async (id: string) => {
    if (!companyCode) return;
    try {
      await deleteDoc(doc(db, 'companies', companyCode, 'rooms', id));
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError('Failed to delete room.');
    }
  };

  // Equipment dialog handlers
  const openEquipmentDialog = (item?: Equipment) => {
    setEquipmentEditMode(!!item);
    setCurrentEquipment(item ? { ...item } : { name: '' });
    setEquipmentDialogOpen(true);
  };
  const closeEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setCurrentEquipment({ name: '' });
    setEquipmentEditMode(false);
  };
  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentEquipment((prev) => ({ ...prev, [name]: value }));
  };
  const handleEquipmentSave = async () => {
    if (!currentEquipment.name || !companyCode) return;
    try {
      if (equipmentEditMode && currentEquipment.id) {
        await updateDoc(doc(db, 'companies', companyCode, 'equipment', currentEquipment.id), {
          name: currentEquipment.name,
          description: currentEquipment.description || '',
        });
        setEquipment((prev) => prev.map((e) => (e.id === currentEquipment.id ? { ...e, ...currentEquipment } : e)));
      } else {
        const docRef = await addDoc(collection(db, 'companies', companyCode, 'equipment'), {
          name: currentEquipment.name,
          description: currentEquipment.description || '',
        });
        setEquipment((prev) => [...prev, { id: docRef.id, name: currentEquipment.name, description: currentEquipment.description }]);
      }
      closeEquipmentDialog();
    } catch (err) {
      setError('Failed to save equipment.');
    }
  };
  const handleEquipmentRemove = async (id: string) => {
    if (!companyCode) return;
    try {
      await deleteDoc(doc(db, 'companies', companyCode, 'equipment', id));
      setEquipment((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError('Failed to delete equipment.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Area, Room & Equipment Management</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Areas</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAreaDialog()}>Add Area</Button>
            </Box>
            <List>
              {areas.map((area) => (
                <ListItem key={area.id}>
                  <ListItemButton>
                    <ListItemText
                      primary={area.name}
                      secondary={area.description}
                    />
                  </ListItemButton>
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit Area"><IconButton onClick={() => openAreaDialog(area)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Remove Area"><IconButton onClick={() => handleAreaRemove(area.id)}><DeleteIcon /></IconButton></Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Rooms</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openRoomDialog()}>Add Room</Button>
            </Box>
            <List>
              {rooms.map((room) => (
                <ListItem key={room.id}>
                  <ListItemButton>
                    <ListItemText
                      primary={room.name}
                      secondary={room.description}
                    />
                  </ListItemButton>
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit Room"><IconButton onClick={() => openRoomDialog(room)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Remove Room"><IconButton onClick={() => handleRoomRemove(room.id)}><DeleteIcon /></IconButton></Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Equipment</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openEquipmentDialog()}>Add Equipment</Button>
            </Box>
            <List>
              {equipment.map((eq) => (
                <ListItem key={eq.id}>
                  <ListItemButton>
                    <ListItemText
                      primary={eq.name}
                      secondary={eq.description}
                    />
                  </ListItemButton>
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit Equipment"><IconButton onClick={() => openEquipmentDialog(eq)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Remove Equipment"><IconButton onClick={() => handleEquipmentRemove(eq.id)}><DeleteIcon /></IconButton></Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}
      {/* Area Dialog */}
      <Dialog open={areaDialogOpen} onClose={closeAreaDialog}>
        <DialogTitle>{areaEditMode ? 'Edit Area' : 'Add Area'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentArea.name}
            onChange={handleAreaChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentArea.description || ''}
            onChange={handleAreaChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAreaDialog}>Cancel</Button>
          <Button onClick={handleAreaSave} variant="contained">{areaEditMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      {/* Room Dialog */}
      <Dialog open={roomDialogOpen} onClose={closeRoomDialog}>
        <DialogTitle>{roomEditMode ? 'Edit Room' : 'Add Room'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentRoom.name}
            onChange={handleRoomChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentRoom.description || ''}
            onChange={handleRoomChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoomDialog}>Cancel</Button>
          <Button onClick={handleRoomSave} variant="contained">{roomEditMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      {/* Equipment Dialog */}
      <Dialog open={equipmentDialogOpen} onClose={closeEquipmentDialog}>
        <DialogTitle>{equipmentEditMode ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentEquipment.name}
            onChange={handleEquipmentChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentEquipment.description || ''}
            onChange={handleEquipmentChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEquipmentDialog}>Cancel</Button>
          <Button onClick={handleEquipmentSave} variant="contained">{equipmentEditMode ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 