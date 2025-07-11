import React, { useState } from 'react';
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

interface Area {
  id: number;
  name: string;
  description?: string;
}

interface Room {
  id: number;
  name: string;
  description?: string;
}

interface Equipment {
  id: number;
  name: string;
  description?: string;
}

const initialAreas: Area[] = [
  {
    id: 1,
    name: 'Production',
    description: 'Main production area',
  },
];

const initialRooms: Room[] = [
  { id: 1, name: 'Mixing Room', description: 'Where ingredients are mixed' },
  { id: 2, name: 'Storage', description: 'Storage for raw materials' },
];

const initialEquipment: Equipment[] = [
  { id: 1, name: 'Mixer', description: 'Industrial mixer' },
  { id: 2, name: 'Conveyor', description: 'Conveyor belt' },
];

export default function Layout() {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);

  // Area dialog state
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [areaEditMode, setAreaEditMode] = useState(false);
  const [currentArea, setCurrentArea] = useState<{ id?: number; name: string; description?: string }>({ name: '' });

  // Room dialog state
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomEditMode, setRoomEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ id?: number; name: string; description?: string }>({ name: '' });

  // Equipment dialog state
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentEditMode, setEquipmentEditMode] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<{ id?: number; name: string; description?: string }>({ name: '' });

  // Area dialog handlers
  const openAreaDialog = (item?: { id: number; name: string; description?: string }) => {
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
  const handleAreaSave = () => {
    if (!currentArea.name) return;
    if (areaEditMode && currentArea.id) {
      setAreas((prev) => prev.map((a) => (a.id === currentArea.id ? { ...a, ...currentArea } : a)));
    } else {
      setAreas((prev) => [...prev, { id: Date.now(), name: currentArea.name, description: currentArea.description }]);
    }
    closeAreaDialog();
  };
  const handleAreaRemove = (id: number) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  // Room dialog handlers
  const openRoomDialog = (item?: { id: number; name: string; description?: string }) => {
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
  const handleRoomSave = () => {
    if (!currentRoom.name) return;
    if (roomEditMode && currentRoom.id) {
      setRooms((prev) => prev.map((r) => (r.id === currentRoom.id ? { ...r, ...currentRoom } : r)));
    } else {
      setRooms((prev) => [...prev, { id: Date.now(), name: currentRoom.name, description: currentRoom.description }]);
    }
    closeRoomDialog();
  };
  const handleRoomRemove = (id: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // Equipment dialog handlers
  const openEquipmentDialog = (item?: { id: number; name: string; description?: string }) => {
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
  const handleEquipmentSave = () => {
    if (!currentEquipment.name) return;
    if (equipmentEditMode && currentEquipment.id) {
      setEquipment((prev) => prev.map((e) => (e.id === currentEquipment.id ? { ...e, ...currentEquipment } : e)));
    } else {
      setEquipment((prev) => [...prev, { id: Date.now(), name: currentEquipment.name, description: currentEquipment.description }]);
    }
    closeEquipmentDialog();
  };
  const handleEquipmentRemove = (id: number) => {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Area, Room & Equipment Management</Typography>
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