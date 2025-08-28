import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  TextField
} from '@mui/material';
import { 
  Checklist, 
  Assignment, 
  Person,
  TrendingUp,
  CheckCircle,
  Schedule,
  ExpandMore,
  Verified,
  CheckCircleOutline,
  CancelOutlined,
  Warning,
  CalendarToday
} from '@mui/icons-material';

interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  departmentName?: string;
}

interface CollectionData {
  id: string;
  completionDate?: string;
  completedAt?: any;
  taskTitle?: string;
  taskType?: string;
  completedBy?: string;
  totalItems?: number;
  completedItems?: number;
  notCompletedItems?: number;
  hasDeviations?: boolean;
  deviations?: string[];
  checklistItems?: Array<{
    title: string;
    status: string;
    deviation?: string;
  }>;
  fields?: Array<{
    label: string;
    value: any;
    type: string;
  }>;
  [key: string]: any;
}

interface OverviewStats {
  checklistCollected: CollectionData[];
  detailedCollected: CollectionData[];
  personalCollected: CollectionData[];
  totalCompleted: number;
  todayCompleted: number;
  thisWeekCompleted: number;
  thisMonthCompleted: number;
}

export default function Overview() {
  const [stats, setStats] = useState<OverviewStats>({
    checklistCollected: [],
    detailedCollected: [],
    personalCollected: [],
    totalCompleted: 0,
    todayCompleted: 0,
    thisWeekCompleted: 0,
    thisMonthCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<CollectionData | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const usersSnap = await getDocs(collection(db, 'companies'));
          for (const companyDoc of usersSnap.docs) {
            const usersCol = await getDocs(collection(db, 'companies', companyDoc.id, 'users'));
            const userDoc = usersCol.docs.find(doc => doc.data().uid === user.uid);
            if (userDoc) {
              setCompanyCode(companyDoc.id);
              break;
            }
          }
        } catch (error) {
          console.error('Error fetching company code:', error);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!companyCode) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all three collections
        const [checklistSnapshot, detailedSnapshot, personalSnapshot] = await Promise.all([
          getDocs(collection(db, 'companies', companyCode, 'checklistCollected')),
          getDocs(collection(db, 'companies', companyCode, 'detailedCollected')),
          getDocs(collection(db, 'companies', companyCode, 'personalCollected'))
        ]);

        const checklistCollected = checklistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionData));
        const detailedCollected = detailedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionData));
        const personalCollected = personalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionData));

        // Calculate statistics
        const totalCompleted = checklistCollected.length + detailedCollected.length + personalCollected.length;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisWeek = getWeekStart(now);
        const thisMonth = getMonthStart(now);

        const todayCompleted = [...checklistCollected, ...detailedCollected, ...personalCollected]
          .filter(item => item.completionDate === today || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] === today).length;

        const thisWeekCompleted = [...checklistCollected, ...detailedCollected, ...personalCollected]
          .filter(item => {
            const itemDate = item.completionDate || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0];
            return itemDate && itemDate >= thisWeek;
          }).length;

        const thisMonthCompleted = [...checklistCollected, ...detailedCollected, ...personalCollected]
          .filter(item => {
            const itemDate = item.completionDate || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0];
            return itemDate && itemDate >= thisMonth;
          }).length;

        setStats({
          checklistCollected,
          detailedCollected,
          personalCollected,
          totalCompleted,
          todayCompleted,
          thisWeekCompleted,
          thisMonthCompleted
        });

        // Fetch user profiles for all unique user IDs
        const uniqueUserIds = new Set([
          ...checklistCollected.map(item => item.completedBy).filter(Boolean),
          ...detailedCollected.map(item => item.completedBy).filter(Boolean),
          ...personalCollected.map(item => item.completedBy || item.userId).filter(Boolean)
        ]);

        const userProfilesData: Record<string, UserProfile> = {};
        for (const userId of Array.from(uniqueUserIds)) {
          if (userId) {
            try {
              const userDoc = await getDoc(doc(db, 'companies', companyCode, 'users', userId));
              if (userDoc.exists()) {
                userProfilesData[userId] = userDoc.data() as UserProfile;
              }
            } catch (error) {
              console.error(`Error fetching user profile for ${userId}:`, error);
            }
          }
        }
        setUserProfiles(userProfilesData);

      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyCode]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };

  const formatDate = (dateString: string | any) => {
    if (!dateString) return 'N/A';
    try {
      if (typeof dateString === 'string') {
        return new Date(dateString).toLocaleDateString();
      }
      if (dateString.toDate) {
        return dateString.toDate().toLocaleDateString();
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const handleVerifyClick = (data: CollectionData) => {
    setSelectedData(data);
    setVerifyDialogOpen(true);
  };

  const handleCloseVerifyDialog = () => {
    setVerifyDialogOpen(false);
    setSelectedData(null);
  };

  const renderUserInfo = (userId: string) => {
    const userProfile = userProfiles[userId];
    
    if (!userProfile) {
      return (
        <Box display="flex" alignItems="center">
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'grey.400' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {userId || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Loading profile...
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Tooltip title={`${userProfile.role || 'No role'}${userProfile.departmentName ? ` • ${userProfile.departmentName}` : ''}`}>
        <Box display="flex" alignItems="center">
          <Avatar 
            src={userProfile.photoURL} 
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : userProfile.email?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {userProfile.name || userProfile.email || 'Unknown User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userProfile.role || 'No role'}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    );
  };

  const renderCollectedData = (data: CollectionData) => {
    const sections = [];

    // Basic Information
    sections.push(
      <Box key="basic" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
          Basic Information
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <List dense disablePadding>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Task Title
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {data.taskTitle || 'N/A'}
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Task Type
                  </Typography>
                }
                secondary={
                  <Chip 
                    label={data.taskType || 'N/A'} 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                }
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Completion Date
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {formatDate(data.completionDate)}
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Completed By
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {renderUserInfo(data.completedBy || '')}
                  </Box>
                }
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    );

    // Checklist Items (if available)
    if (data.checklistItems && data.checklistItems.length > 0) {
      sections.push(
        <Box key="checklist" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Checklist Items
          </Typography>
          <Paper sx={{ bgcolor: 'grey.50', borderRadius: 2, overflow: 'hidden' }}>
            {data.checklistItems.map((item, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  borderBottom: index < data.checklistItems!.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
              >
                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                  {item.status === 'completed' ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                  ) : item.status === 'not_completed' ? (
                    <CancelOutlined color="error" sx={{ mr: 1 }} />
                  ) : (
                    <Warning color="warning" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                    {item.title}
                  </Typography>
                  <Chip 
                    label={item.status.replace('_', ' ')} 
                    color={item.status === 'completed' ? 'success' : item.status === 'not_completed' ? 'error' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                  />
                </Box>
                {item.deviation && (
                  <Box sx={{ ml: 4, mt: 1 }}>
                    <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                      ⚠️ Deviation: {item.deviation}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Paper>
        </Box>
      );
    }

    // Detailed Fields (if available)
    if (data.fields && data.fields.length > 0) {
      sections.push(
        <Box key="fields" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Collected Data
          </Typography>
          <Paper sx={{ bgcolor: 'grey.50', borderRadius: 2, overflow: 'hidden' }}>
            {data.fields.map((field, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  borderBottom: index < data.fields!.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {field.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {field.value}
                    </Typography>
                  </Box>
                  <Chip 
                    label={field.type} 
                    color="info" 
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      );
    }

    // Deviations (if any)
    if (data.deviations && data.deviations.length > 0) {
      sections.push(
        <Box key="deviations" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
            ⚠️ Deviations
          </Typography>
          <Paper sx={{ bgcolor: 'error.light', borderRadius: 2, p: 2 }}>
            {data.deviations.map((deviation, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="body1" color="error.dark" sx={{ fontWeight: 500 }}>
                  {deviation}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      );
    }

    // Summary Statistics
    if (data.totalItems !== undefined) {
      sections.push(
        <Box key="summary" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Summary
          </Typography>
          <Paper sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                  {data.totalItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                  {data.completedItems || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: '1 1 100px' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                  {data.notCompletedItems || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Not Completed
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      );
    }

    return sections;
  };

  const filteredChecklistCollected = stats.checklistCollected.filter(item => 
    item.completionDate === selectedDate || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] === selectedDate
  );
  const filteredDetailedCollected = stats.detailedCollected.filter(item => 
    item.completionDate === selectedDate || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] === selectedDate
  );
  const filteredPersonalCollected = stats.personalCollected.filter(item => 
    item.completionDate === selectedDate || item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] === selectedDate
  );
  const filteredTotalCompleted = filteredChecklistCollected.length + filteredDetailedCollected.length + filteredPersonalCollected.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard Overview
      </Typography>

      {/* Date Selector */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
          <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Select Date:
          </Typography>
        </Box>
        <TextField
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'primary.main',
              },
              '&:hover fieldset': {
                borderColor: 'primary.dark',
              },
            },
          }}
          InputProps={{
            sx: {
              fontWeight: 500,
              fontSize: '1rem',
            }
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Viewing tasks completed on {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px', minWidth: 200, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {filteredTotalCompleted}
                </Typography>
                <Typography variant="body2">
                  Total Completed
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', minWidth: 200, bgcolor: 'success.light', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {filteredChecklistCollected.length}
                </Typography>
                <Typography variant="body2">
                  Checklist Tasks
                </Typography>
              </Box>
              <Checklist sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', minWidth: 200, bgcolor: 'info.light', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {filteredDetailedCollected.length}
                </Typography>
                <Typography variant="body2">
                  Detailed Tasks
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', minWidth: 200, bgcolor: 'warning.light', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {filteredPersonalCollected.length}
                </Typography>
                <Typography variant="body2">
                  Personal Tasks
                </Typography>
              </Box>
              <Person sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Collection Details */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Paper sx={{ flex: '1 1 300px', minWidth: 300, p: 2, height: 'fit-content' }}>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Checklist sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Checklist Tasks</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
            {filteredChecklistCollected.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed checklist tasks
          </Typography>
        </Paper>

        <Paper sx={{ flex: '1 1 300px', minWidth: 300, p: 2, height: 'fit-content' }}>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Assignment sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">Detailed Tasks</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h4" color="success.main" sx={{ mb: 1 }}>
            {filteredDetailedCollected.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed detailed tasks
          </Typography>
        </Paper>

        <Paper sx={{ flex: '1 1 300px', minWidth: 300, p: 2, height: 'fit-content' }}>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Person sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">Personal Tasks</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h4" color="info.main" sx={{ mb: 1 }}>
            {filteredPersonalCollected.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completed personal tasks
          </Typography>
        </Paper>
      </Box>

      {/* Detailed Data Tables */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Collected Data Details
        </Typography>

        {/* Checklist Tasks Data */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Checklist sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Checklist Tasks Data ({filteredChecklistCollected.length})</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {filteredChecklistCollected.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Task Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completion Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Items Completed</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Deviations</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completed By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredChecklistCollected.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.taskTitle || 'Untitled Task'}</TableCell>
                        <TableCell>{formatDate(item.completionDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${item.completedItems || 0}/${item.totalItems || 0}`}
                            color={item.completedItems === item.totalItems ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.hasDeviations ? (
                            <Chip label="Yes" color="error" size="small" />
                          ) : (
                            <Chip label="No" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {renderUserInfo(item.completedBy || '')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Verified />}
                            onClick={() => handleVerifyClick(item)}
                            sx={{ minWidth: 80 }}
                          >
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No checklist tasks completed yet.</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Detailed Tasks Data */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Assignment sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Detailed Tasks Data ({filteredDetailedCollected.length})</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {filteredDetailedCollected.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Task Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completion Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Task Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completed By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDetailedCollected.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.taskTitle || 'Untitled Task'}</TableCell>
                        <TableCell>{formatDate(item.completionDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.taskType || 'Detailed'}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {renderUserInfo(item.completedBy || '')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Verified />}
                            onClick={() => handleVerifyClick(item)}
                            sx={{ minWidth: 80 }}
                          >
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No detailed tasks completed yet.</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Personal Tasks Data */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Person sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Personal Tasks Data ({filteredPersonalCollected.length})</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {filteredPersonalCollected.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Task Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Completion Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPersonalCollected.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.taskTitle || 'Untitled Task'}</TableCell>
                        <TableCell>{formatDate(item.completionDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.actionType || 'Task Completed'}
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {renderUserInfo(item.userId || item.completedBy || '')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Verified />}
                            onClick={() => handleVerifyClick(item)}
                            sx={{ minWidth: 80 }}
                          >
                            Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No personal tasks completed yet.</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Verify Data Dialog */}
      <Dialog 
        open={verifyDialogOpen} 
        onClose={handleCloseVerifyDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Verified sx={{ mr: 1, color: 'primary.main' }} />
            Verify Collected Data
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedData && renderCollectedData(selectedData)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 