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
  ListItemButton,
  Card,
  CardContent,
  CardHeader,
  Fade,
  Stack,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BuildIcon from '@mui/icons-material/Build';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, collectionGroup } from 'firebase/firestore';

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

const initialAreas: Area[] = [
  {
    id: '1',
    name: 'Production',
    description: 'Main production area',
  },
];

const initialRooms: Room[] = [
  { id: '1', name: 'Mixing Room', description: 'Where ingredients are mixed' },
  { id: '2', name: 'Storage', description: 'Storage for raw materials' },
];

const initialEquipment: Equipment[] = [
  { id: '1', name: 'Mixer', description: 'Industrial mixer' },
  { id: '2', name: 'Conveyor', description: 'Conveyor belt' },
];

export default function Layout() {
  const [companyCode, setCompanyCode] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

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

  // Fetch current user companyCode
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collectionGroup(db, 'users'));
        const userDoc = usersSnap.docs.find(d => d.data().uid === user.uid);
        if (userDoc) {
          setCompanyCode(userDoc.data().companyCode);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Load data from Firestore
  useEffect(() => {
    if (!companyCode) return;
    const load = async () => {
      const areasSnap = await getDocs(collection(db, 'companies', companyCode, 'areas'));
      setAreas(areasSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Area[]);

      const roomsSnap = await getDocs(collection(db, 'companies', companyCode, 'rooms'));
      setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Room[]);

      const eqSnap = await getDocs(collection(db, 'companies', companyCode, 'equipment'));
      setEquipment(eqSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Equipment[]);
    };
    load();
  }, [companyCode]);

  // Area dialog handlers
  const openAreaDialog = (item?: { id: string; name: string; description?: string }) => {
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
    if (areaEditMode && currentArea.id) {
      await updateDoc(doc(db, 'companies', companyCode, 'areas', currentArea.id), {
        name: currentArea.name,
        description: currentArea.description || ''
      });
      setAreas(prev => prev.map(a => a.id === currentArea.id ? { ...a, name: currentArea.name, description: currentArea.description } as Area : a));
    } else {
      const ref = await addDoc(collection(db, 'companies', companyCode, 'areas'), {
        name: currentArea.name,
        description: currentArea.description || ''
      });
      setAreas(prev => [...prev, { id: ref.id, name: currentArea.name, description: currentArea.description } as Area]);
    }
    closeAreaDialog();
  };
  const handleAreaRemove = async (id: string) => {
    if (!companyCode) return;
    await deleteDoc(doc(db, 'companies', companyCode, 'areas', id));
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  // Room dialog handlers
  const openRoomDialog = (item?: { id: string; name: string; description?: string }) => {
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
    if (roomEditMode && currentRoom.id) {
      await updateDoc(doc(db, 'companies', companyCode, 'rooms', currentRoom.id), {
        name: currentRoom.name,
        description: currentRoom.description || ''
      });
      setRooms(prev => prev.map(r => r.id === currentRoom.id ? { ...r, name: currentRoom.name, description: currentRoom.description } as Room : r));
    } else {
      const ref = await addDoc(collection(db, 'companies', companyCode, 'rooms'), {
        name: currentRoom.name,
        description: currentRoom.description || ''
      });
      setRooms(prev => [...prev, { id: ref.id, name: currentRoom.name, description: currentRoom.description } as Room]);
    }
    closeRoomDialog();
  };
  const handleRoomRemove = async (id: string) => {
    if (!companyCode) return;
    await deleteDoc(doc(db, 'companies', companyCode, 'rooms', id));
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // Equipment dialog handlers
  const openEquipmentDialog = (item?: { id: string; name: string; description?: string }) => {
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
    if (equipmentEditMode && currentEquipment.id) {
      await updateDoc(doc(db, 'companies', companyCode, 'equipment', currentEquipment.id), {
        name: currentEquipment.name,
        description: currentEquipment.description || ''
      });
      setEquipment(prev => prev.map(e => e.id === currentEquipment.id ? { ...e, name: currentEquipment.name, description: currentEquipment.description } as Equipment : e));
    } else {
      const ref = await addDoc(collection(db, 'companies', companyCode, 'equipment'), {
        name: currentEquipment.name,
        description: currentEquipment.description || ''
      });
      setEquipment(prev => [...prev, { id: ref.id, name: currentEquipment.name, description: currentEquipment.description } as Equipment]);
    }
    closeEquipmentDialog();
  };
  const handleEquipmentRemove = async (id: string) => {
    if (!companyCode) return;
    await deleteDoc(doc(db, 'companies', companyCode, 'equipment', id));
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  };

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
              <DashboardCustomizeIcon sx={{ 
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
                Location Management
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Manage your areas, rooms, and equipment
            </Typography>
        </Box>
        </Card>
      </Fade>
      {/* Modern Areas Section */}
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
                <LocationOnIcon sx={{ color: '#667eea', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Areas
                </Typography>
                <Chip 
                  label={`${areas.length} ${areas.length === 1 ? 'Area' : 'Areas'}`}
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
                onClick={() => openAreaDialog()}
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
                Add Area
              </Button>
            }
          />
          <CardContent>
            {areas.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#2c3e50'
              }}>
                <LocationOnIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  No Areas Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add Area" to create your first area
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 2 
              }}>
                {areas.map((area) => (
                  <Box key={area.id}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: 2,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: '#2c3e50',
                            fontSize: '1.1rem'
                          }}>
                            {area.name}
                          </Typography>
                          <Box>
                            <Tooltip title="Edit Area">
                              <IconButton 
                                size="small" 
                                onClick={() => openAreaDialog(area)}
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
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Area">
                              <IconButton 
                                size="small" 
                                onClick={() => handleAreaRemove(area.id)}
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
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        {area.description && (
                          <Typography variant="body2" sx={{ 
                            color: '#2c3e50', 
                            opacity: 0.8,
                            fontSize: '0.9rem'
                          }}>
                            {area.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
        </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
      {/* Modern Rooms Section */}
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
                <MeetingRoomIcon sx={{ color: '#FF9800', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Rooms
                </Typography>
                <Chip 
                  label={`${rooms.length} ${rooms.length === 1 ? 'Room' : 'Rooms'}`}
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
                onClick={() => openRoomDialog()}
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
                Add Room
              </Button>
            }
          />
          <CardContent>
            {rooms.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#2c3e50'
              }}>
                <MeetingRoomIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  No Rooms Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add Room" to create your first room
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 2 
              }}>
                {rooms.map((room) => (
                  <Box key={room.id}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      borderRadius: 2,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(255, 152, 0, 0.2)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: '#2c3e50',
                            fontSize: '1.1rem'
                          }}>
                            {room.name}
                          </Typography>
                          <Box>
                            <Tooltip title="Edit Room">
                              <IconButton 
                                size="small" 
                                onClick={() => openRoomDialog(room)}
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
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Room">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRoomRemove(room.id)}
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
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        {room.description && (
                          <Typography variant="body2" sx={{ 
                            color: '#2c3e50', 
                            opacity: 0.8,
                            fontSize: '0.9rem'
                          }}>
                            {room.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
        </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
      {/* Modern Equipment Section */}
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
                <BuildIcon sx={{ color: '#2196F3', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Equipment
                </Typography>
                <Chip 
                  label={`${equipment.length} ${equipment.length === 1 ? 'Equipment' : 'Equipment'}`}
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
                onClick={() => openEquipmentDialog()}
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
                Add Equipment
              </Button>
            }
          />
          <CardContent>
            {equipment.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#2c3e50'
              }}>
                <BuildIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  No Equipment Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add Equipment" to create your first equipment
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 2 
              }}>
                {equipment.map((eq) => (
                  <Box key={eq.id}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(25, 118, 210, 0.05))',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      borderRadius: 2,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(33, 150, 243, 0.2)',
                        transition: 'all 0.3s ease'
                      }
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: '#2c3e50',
                            fontSize: '1.1rem'
                          }}>
                            {eq.name}
                          </Typography>
                          <Box>
                            <Tooltip title="Edit Equipment">
                              <IconButton 
                                size="small" 
                                onClick={() => openEquipmentDialog(eq)}
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
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Equipment">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEquipmentRemove(eq.id)}
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
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        {eq.description && (
                          <Typography variant="body2" sx={{ 
                            color: '#2c3e50', 
                            opacity: 0.8,
                            fontSize: '0.9rem'
                          }}>
                            {eq.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
      {/* Modern Area Dialog */}
      <Dialog 
        open={areaDialogOpen} 
        onClose={closeAreaDialog}
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
          {areaEditMode ? 'Edit Area' : 'Add Area'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentArea.name}
            onChange={handleAreaChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentArea.description || ''}
            onChange={handleAreaChange}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={closeAreaDialog}
            sx={{ 
              color: '#667eea',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAreaSave} 
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
            {areaEditMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modern Room Dialog */}
      <Dialog 
        open={roomDialogOpen} 
        onClose={closeRoomDialog}
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
          {roomEditMode ? 'Edit Room' : 'Add Room'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentRoom.name}
            onChange={handleRoomChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentRoom.description || ''}
            onChange={handleRoomChange}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={closeRoomDialog}
            sx={{ 
              color: '#FF9800',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRoomSave} 
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
            {roomEditMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modern Equipment Dialog */}
      <Dialog 
        open={equipmentDialogOpen} 
        onClose={closeEquipmentDialog}
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
          {equipmentEditMode ? 'Edit Equipment' : 'Add Equipment'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            value={currentEquipment.name}
            onChange={handleEquipmentChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={currentEquipment.description || ''}
            onChange={handleEquipmentChange}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={closeEquipmentDialog}
            sx={{ 
              color: '#2196F3',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEquipmentSave} 
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
            {equipmentEditMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 