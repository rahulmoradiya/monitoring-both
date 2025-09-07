import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Card, 
  CardContent, 
  CardHeader,
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
  TextField,
  Fade,
  Stack
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
  CalendarToday,
  Assessment,
  DashboardCustomize
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
  verifiedBy?: {
    uid: string;
    name: string;
    email?: string | null;
    role?: string;
    departmentName?: string;
    verifiedAt: string;
  };
  verificationStatus?: 'pending' | 'verified';
  verifiedAt?: string;
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

export default function Verification() {
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
          // If no company found, still set loading to false
          if (!companyCode) {
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching company code:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

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

        const checklistCollected = checklistSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          taskType: 'checklist',
          ...doc.data() 
        } as CollectionData));
        const detailedCollected = detailedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          taskType: 'detailed',
          ...doc.data() 
        } as CollectionData));
        const personalCollected = personalSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          taskType: 'personal',
          ...doc.data() 
        } as CollectionData));

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

        // Debug logging for fetched data
        console.log('Fetched data:', {
          checklistCollected: checklistCollected.length,
          detailedCollected: detailedCollected.length,
          personalCollected: personalCollected.length,
          sampleDetailed: detailedCollected[0] || 'No detailed tasks',
          sampleDetailedKeys: detailedCollected[0] ? Object.keys(detailedCollected[0]) : []
        });
        
        // Debug logging for date fields in detailed tasks
        if (detailedCollected.length > 0) {
          console.log('Detailed task date fields:', detailedCollected.map(item => ({
            taskTitle: item.taskTitle,
            completionDate: item.completionDate,
            completedAt: item.completedAt,
            createdAt: item.createdAt,
            timestamp: item.timestamp,
            allKeys: Object.keys(item)
          })));
        }

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
    console.log('Verify button clicked for:', data);
    console.log('Task type:', data.taskType);
    console.log('Task data:', data);
    setSelectedData(data);
    setVerifyDialogOpen(true);
  };

  const handleCloseVerifyDialog = () => {
    setVerifyDialogOpen(false);
    setSelectedData(null);
  };

  const handleVerifyTask = async (data: CollectionData) => {
    if (!companyCode || !data.id) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No authenticated user found');
        return;
      }

      // Get current user's profile information
      const userProfile = userProfiles[currentUser.uid];
      const verifiedAt = new Date().toISOString();
      const verifiedBy = {
        uid: currentUser.uid,
        name: userProfile?.name || currentUser.email || 'Unknown User',
        email: currentUser.email,
        role: userProfile?.role || 'No role',
        departmentName: userProfile?.departmentName || 'No department',
        verifiedAt: verifiedAt
      };

      // Determine which collection to update based on task type
      let collectionPath = '';
      let collectionName = '';
      
      // Debug logging
      console.log('Verifying task:', {
        id: data.id,
        taskType: data.taskType,
        taskTitle: data.taskTitle,
        companyCode: companyCode
      });

      if (data.taskType === 'checklist') {
        collectionPath = `companies/${companyCode}/checklistCollected`;
        collectionName = 'checklistCollected';
      } else if (data.taskType === 'detailed') {
        collectionPath = `companies/${companyCode}/detailedCollected`;
        collectionName = 'detailedCollected';
      } else {
        // Default to personalCollected if no taskType or unknown type
        collectionPath = `companies/${companyCode}/personalCollected`;
        collectionName = 'personalCollected';
      }

      console.log('Collection path:', collectionPath);
      console.log('Document ID:', data.id);

      // First, check if the document exists before trying to update it
      let docRef = doc(db, collectionPath, data.id);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error(`Document ${data.id} does not exist in collection ${collectionName}`);
        console.error('Available collections:', ['checklistCollected', 'detailedCollected', 'personalCollected']);
        
        // Try to find the document in other collections
        for (const collection of ['checklistCollected', 'detailedCollected', 'personalCollected']) {
          const testPath = `companies/${companyCode}/${collection}`;
          const testDocRef = doc(db, testPath, data.id);
          const testDocSnap = await getDoc(testDocRef);
          if (testDocSnap.exists()) {
            console.log(`Document found in ${collection} collection`);
            collectionPath = testPath;
            // Update the docRef to point to the correct collection
            docRef = doc(db, collectionPath, data.id);
            break;
          }
        }
      }

      // Log the final document reference being used
      console.log('Final document reference:', docRef.path);
      
      // Update the document with verification information
      await updateDoc(docRef, {
        verifiedBy: verifiedBy,
        verificationStatus: 'verified',
        verifiedAt: verifiedAt
      });

      // Update local state to reflect the change
      setStats(prevStats => ({
        ...prevStats,
        checklistCollected: prevStats.checklistCollected.map(item => 
          item.id === data.id ? { ...item, verifiedBy: verifiedBy, verificationStatus: 'verified', verifiedAt: verifiedAt } : item
        ),
        detailedCollected: prevStats.detailedCollected.map(item => 
          item.id === data.id ? { ...item, verifiedBy: verifiedBy, verificationStatus: 'verified', verifiedAt: verifiedAt } : item
        ),
        personalCollected: prevStats.personalCollected.map(item => 
          item.id === data.id ? { ...item, verifiedBy: verifiedBy, verificationStatus: 'verified', verifiedAt: verifiedAt } : item
        )
      }));

      console.log('Task verified successfully:', data.id);
      
      // Close the dialog
      handleCloseVerifyDialog();
      
    } catch (error) {
      console.error('Error verifying task:', error);
      // You could add a toast notification here for user feedback
    }
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
    // Debug logging to see what data we're working with
    console.log('renderCollectedData called with:', data);
    console.log('Data keys:', Object.keys(data));
    console.log('Task type:', data.taskType);
    console.log('Fields:', data.fields);
    console.log('Raw data entries:', Object.entries(data).filter(([key, value]) => 
      !['id', 'taskTitle', 'taskType', 'completionDate', 'completedBy', 'verificationStatus', 'verifiedBy', 'verifiedAt'].includes(key) &&
      value !== null && value !== undefined && value !== ''
    ));
    
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
            
            {/* Verified By section - only show if task is verified */}
            {data.verificationStatus === 'verified' && data.verifiedBy && (
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemText 
                  primary={
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Verified By
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'success.main' }}>
                          <CheckCircle />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {data.verifiedBy.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {data.verifiedBy.role || 'No role'}
                            {data.verifiedBy.departmentName && ` • ${data.verifiedBy.departmentName}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Verified on: {formatDate(data.verifiedAt || data.verifiedBy.verifiedAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>
    );

    // Additional Task Information for Detailed Tasks
    if (data.taskType === 'detailed') {
      const additionalFields = [];
      
      // Add any additional fields that detailed tasks might have
      if (data.temperature) additionalFields.push({ label: 'Temperature', value: data.temperature, type: 'measurement' });
      if (data.humidity) additionalFields.push({ label: 'Humidity', value: data.humidity, type: 'measurement' });
      if (data.ph) additionalFields.push({ label: 'pH Level', value: data.ph, type: 'measurement' });
      if (data.weight) additionalFields.push({ label: 'Weight', value: data.weight, type: 'measurement' });
      if (data.quantity) additionalFields.push({ label: 'Quantity', value: data.quantity, type: 'count' });
      if (data.notes) additionalFields.push({ label: 'Notes', value: data.notes, type: 'text' });
      if (data.observations) additionalFields.push({ label: 'Observations', value: data.observations, type: 'text' });
      if (data.measurements) additionalFields.push({ label: 'Measurements', value: data.measurements, type: 'data' });
      
      if (additionalFields.length > 0) {
        sections.push(
          <Box key="additionalInfo" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Task Measurements & Observations
            </Typography>
            <Paper sx={{ bgcolor: 'grey.50', borderRadius: 2, overflow: 'hidden' }}>
              {additionalFields.map((field, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    borderBottom: index < additionalFields.length - 1 ? '1px solid' : 'none',
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
                        {typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : String(field.value)}
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
    }

    // Checklist Items (if available) - Show for checklist tasks
    if (data.taskType === 'checklist' && data.checklistItems && data.checklistItems.length > 0) {
      sections.push(
        <Box key="checklist" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            📋 Checklist Items
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

    // Detailed Fields are now handled by the smart data display above

    // Smart Data Display for Detailed Tasks - Show only essential data
    if (data.taskType === 'detailed') {
      const essentialFields = [];
      
      // Extract temperature and other measurement data from fieldValues
      if (data.fieldValues) {
        Object.entries(data.fieldValues).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const fieldData = value as any; // Type assertion for dynamic field access
            
            // Handle nested temperature data like amount_0.temperature
            if (fieldData.temperature !== undefined) {
              essentialFields.push({
                label: 'Temperature',
                value: `${fieldData.temperature}°${fieldData.temperatureUnit || 'C'}`,
                icon: '🌡️',
                type: 'measurement'
              });
            }
            // Handle other measurement fields
            if (fieldData.humidity !== undefined) {
              essentialFields.push({
                label: 'Humidity',
                value: `${fieldData.humidity}%`,
                icon: '💧',
                type: 'measurement'
              });
            }
            if (fieldData.ph !== undefined) {
              essentialFields.push({
                label: 'pH Level',
                value: fieldData.ph,
                icon: '🧪',
                type: 'measurement'
              });
            }
            if (fieldData.weight !== undefined) {
              essentialFields.push({
                label: 'Weight',
                value: `${fieldData.weight} ${fieldData.weightUnit || 'kg'}`,
                icon: '⚖️',
                type: 'measurement'
              });
            }
            if (fieldData.quantity !== undefined) {
              essentialFields.push({
                label: 'Quantity',
                value: fieldData.quantity,
                icon: '🔢',
                type: 'count'
              });
            }
          }
        });
      }
      
      // Add other essential fields
      if (data.notes) {
        essentialFields.push({
          label: 'Notes',
          value: data.notes,
          icon: '📝',
          type: 'text'
        });
      }
      
      if (data.observations) {
        essentialFields.push({
          label: 'Observations',
          value: data.observations,
          icon: '👁️',
          type: 'text'
        });
      }
      
      if (data.measurements) {
        essentialFields.push({
          label: 'Additional Measurements',
          value: data.measurements,
          icon: '📊',
          type: 'data'
        });
      }
      
      // If we have essential fields, display them nicely
      if (essentialFields.length > 0) {
        sections.push(
          <Box key="essentialData" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              📊 Collected Measurements & Data
            </Typography>
            <Paper sx={{ bgcolor: 'grey.50', borderRadius: 2, overflow: 'hidden' }}>
              {essentialFields.map((field, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    borderBottom: index < essentialFields.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: 'white',
                    '&:hover': { bgcolor: 'grey.50' }
                  }}
                >
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {field.icon}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {field.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : String(field.value)}
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
    }

    // Summary Statistics for Checklist Tasks
    if (data.taskType === 'checklist' && data.totalItems !== undefined) {
      sections.push(
        <Box key="summary" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            📊 Checklist Summary
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

    // Deviations for Checklist Tasks (if any)
    if (data.taskType === 'checklist' && data.deviations && data.deviations.length > 0) {
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

    return sections;
  };

  // Enhanced date filtering with debugging and fallback date fields
  const filteredChecklistCollected = stats.checklistCollected.filter(item => {
    const itemDate = item.completionDate || 
                    item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    item.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0];
    return itemDate === selectedDate;
  });
  
  const filteredDetailedCollected = stats.detailedCollected.filter(item => {
    const itemDate = item.completionDate || 
                    item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    item.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    item.timestamp?.toDate?.()?.toISOString?.()?.split('T')[0];
    
    // Debug logging for detailed tasks
    if (item.taskTitle === 'Temp 1' || item.taskTitle === 'dfdsf') {
      console.log('Detailed task date filtering:', {
        taskTitle: item.taskTitle,
        completionDate: item.completionDate,
        completedAt: item.completedAt,
        createdAt: item.createdAt,
        timestamp: item.timestamp,
        selectedDate: selectedDate,
        itemDate: itemDate,
        matches: itemDate === selectedDate
      });
    }
    
    return itemDate === selectedDate;
  });
  
  const filteredPersonalCollected = stats.personalCollected.filter(item => {
    const itemDate = item.completionDate || 
                    item.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    item.createdAt?.toDate?.()?.toISOString?.()?.split('T')[0] ||
                    item.timestamp?.toDate?.()?.toISOString?.()?.split('T')[0];
    return itemDate === selectedDate;
  });
      const filteredTotalCompleted = filteredChecklistCollected.length + filteredDetailedCollected.length + filteredPersonalCollected.length;
    
    // Count verified and pending verification tasks for the selected date
    const filteredVerifiedCount = filteredChecklistCollected.filter(item => item.verificationStatus === 'verified').length +
                                  filteredDetailedCollected.filter(item => item.verificationStatus === 'verified').length +
                                  filteredPersonalCollected.filter(item => item.verificationStatus === 'verified').length;
    
    const filteredPendingCount = filteredTotalCompleted - filteredVerifiedCount;

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        <Fade in timeout={600}>
          <Card sx={{ 
            p: 4, 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <CircularProgress size={60} sx={{ color: '#667eea', mb: 2 }} />
            <Typography variant="h6" sx={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600
            }}>
              Loading Verification Data...
            </Typography>
          </Card>
        </Fade>
      </Box>
    );
  }

  // Check if there's no data for the selected date
  const hasNoDataForDate = filteredTotalCompleted === 0;

  if (hasNoDataForDate) {
    return (
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Modern Header */}
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
                <Assessment sx={{ 
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
                  Verification Dashboard
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                Monitor and verify completed tasks and data collection
              </Typography>
            </Box>
          </Card>
        </Fade>

        {/* Modern Date Selector */}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Date Selection
                  </Typography>
                </Box>
              }
              sx={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      }
                    }
                  }}
                  InputProps={{
                    sx: {
                      fontWeight: 500,
                      fontSize: '1rem',
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontWeight: 500,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Viewing tasks completed on {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Modern No Data Message */}
        <Fade in timeout={1000}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h1" sx={{ 
                  color: '#667eea', 
                  mb: 3,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>
                  🔍
                </Typography>
                <Typography variant="h4" sx={{ 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700, 
                  mb: 2 
                }}>
                  No Tasks Completed Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                  There are no completed tasks for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}. The verification dashboard will show completed tasks once team members start completing their monitoring assignments.
                </Typography>
              </Box>
              
              <Box sx={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                borderRadius: 2,
                p: 3,
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 3,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  What you'll see here:
                </Typography>
                <Stack spacing={1} alignItems="flex-start">
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
                    Completed checklist and detailed monitoring tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
                    Personal task completions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Verified sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
                    Verification status and data review
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
                    Task completion statistics and trends
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Modern Header */}
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
              <Assessment sx={{ 
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
                Verification Dashboard
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Monitor and verify completed tasks and data collection
            </Typography>
          </Box>
        </Card>
      </Fade>

      {/* Modern Date Selector */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Date Selection
                </Typography>
              </Box>
            }
            sx={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
              borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          />
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    }
                  }
                }}
                InputProps={{
                  sx: {
                    fontWeight: 500,
                    fontSize: '1rem',
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontWeight: 500,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Viewing tasks completed on {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Modern Summary Cards */}
      <Fade in timeout={1000}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredTotalCompleted}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Total Completed
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredChecklistCollected.length}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Checklist Tasks
                  </Typography>
                </Box>
                <Checklist sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(33, 150, 243, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredDetailedCollected.length}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Detailed Tasks
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(255, 152, 0, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredPersonalCollected.length}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Personal Tasks
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Fade>

      {/* Modern Verification Status Cards */}
      <Fade in timeout={1200}>
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(255, 152, 0, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredPendingCount}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Verification Pending
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            flex: '1 1 200px', 
            minWidth: 200, 
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {filteredVerifiedCount}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Verified
                  </Typography>
                </Box>
                <Verified sx={{ fontSize: 48, opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Fade>



      {/* Modern Data Tables Section */}
      <Fade in timeout={1400}>
        <Box>
          {/* Checklist Tasks Container */}
            <Card sx={{ 
              mb: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(76, 175, 80, 0.2)',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)',
              overflow: 'hidden'
            }}>
              <Accordion 
                defaultExpanded 
                sx={{ 
                  '& .MuiAccordionSummary-root': {
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.05))',
                    borderBottom: '1px solid rgba(76, 175, 80, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(69, 160, 73, 0.08))',
                    }
                  },
                  '& .MuiAccordionDetails-root': {
                    p: 0
                  }
                }}
              >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#4CAF50' }} />}
                sx={{ px: 3, py: 2 }}
              >
                <Box display="flex" alignItems="center">
                  <Checklist sx={{ mr: 2, color: '#4CAF50', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Checklist Tasks Data ({filteredChecklistCollected.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {filteredChecklistCollected.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }
                        }}>
                          <TableCell>Task Title</TableCell>
                          <TableCell>Completion Date</TableCell>
                          <TableCell>Items Completed</TableCell>
                          <TableCell>Deviations</TableCell>
                          <TableCell>Completed By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredChecklistCollected.map((item) => (
                          <TableRow 
                            key={item.id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(69, 160, 73, 0.02))',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              transition: 'all 0.3s ease',
                              '&:nth-of-type(even)': {
                                background: 'rgba(76, 175, 80, 0.02)'
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                {item.taskTitle || 'Untitled Task'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(item.completionDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`${item.completedItems || 0}/${item.totalItems || 0}`}
                                sx={{ 
                                  background: item.completedItems === item.totalItems 
                                    ? 'linear-gradient(45deg, #4CAF50, #45a049)'
                                    : 'linear-gradient(45deg, #FF9800, #F57C00)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {item.hasDeviations ? (
                                <Chip 
                                  label="Yes" 
                                  sx={{ 
                                    background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                  size="small" 
                                />
                              ) : (
                                <Chip 
                                  label="No" 
                                  sx={{ 
                                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                  size="small" 
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {renderUserInfo(item.completedBy || '')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={item.verificationStatus === 'verified' ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={item.verificationStatus === 'verified' ? <CheckCircle /> : <Verified />}
                                onClick={() => handleVerifyClick(item)}
                                sx={{ 
                                  minWidth: 100,
                                  background: item.verificationStatus === 'verified' 
                                    ? 'linear-gradient(45deg, #4CAF50, #45a049)'
                                    : 'transparent',
                                  borderColor: '#4CAF50',
                                  color: item.verificationStatus === 'verified' ? 'white' : '#4CAF50',
                                  '&:hover': {
                                    background: item.verificationStatus === 'verified' 
                                      ? 'linear-gradient(45deg, #45a049, #3d8b40)'
                                      : 'rgba(76, 175, 80, 0.1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {item.verificationStatus === 'verified' ? 'View Data' : 'Verify'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Checklist sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No Checklist Tasks Completed Yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Checklist tasks will appear here once team members complete their assignments
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
              </Accordion>
            </Card>

            {/* Detailed Tasks Container */}
            <Card sx={{ 
              mb: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(33, 150, 243, 0.2)',
              boxShadow: '0 8px 32px rgba(33, 150, 243, 0.1)',
              overflow: 'hidden'
            }}>
              <Accordion 
                defaultExpanded 
                sx={{ 
                  '& .MuiAccordionSummary-root': {
                    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(25, 118, 210, 0.05))',
                    borderBottom: '1px solid rgba(33, 150, 243, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(25, 118, 210, 0.08))',
                    }
                  },
                  '& .MuiAccordionDetails-root': {
                    p: 0
                  }
                }}
              >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#2196F3' }} />}
                sx={{ px: 3, py: 2 }}
              >
                <Box display="flex" alignItems="center">
                  <Assignment sx={{ mr: 2, color: '#2196F3', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Detailed Tasks Data ({filteredDetailedCollected.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {filteredDetailedCollected.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }
                        }}>
                          <TableCell>Task Title</TableCell>
                          <TableCell>Completion Date</TableCell>
                          <TableCell>Task Type</TableCell>
                          <TableCell>Completed By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDetailedCollected.map((item) => (
                          <TableRow 
                            key={item.id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(25, 118, 210, 0.02))',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              transition: 'all 0.3s ease',
                              '&:nth-of-type(even)': {
                                background: 'rgba(33, 150, 243, 0.02)'
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                {item.taskTitle || 'Untitled Task'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(item.completionDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.taskType || 'Detailed'}
                                sx={{ 
                                  background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              {renderUserInfo(item.completedBy || '')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={item.verificationStatus === 'verified' ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={item.verificationStatus === 'verified' ? <CheckCircle /> : <Verified />}
                                onClick={() => {
                                  console.log('Detailed task button clicked:', item);
                                  handleVerifyClick(item);
                                }}
                                sx={{ 
                                  minWidth: 100,
                                  background: item.verificationStatus === 'verified' 
                                    ? 'linear-gradient(45deg, #4CAF50, #45a049)'
                                    : 'transparent',
                                  borderColor: '#2196F3',
                                  color: item.verificationStatus === 'verified' ? 'white' : '#2196F3',
                                  '&:hover': {
                                    background: item.verificationStatus === 'verified' 
                                      ? 'linear-gradient(45deg, #45a049, #3d8b40)'
                                      : 'rgba(33, 150, 243, 0.1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {item.verificationStatus === 'verified' ? 'View Data' : 'Verify'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No Detailed Tasks Completed Yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Detailed tasks will appear here once team members complete their assignments
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
              </Accordion>
            </Card>

            {/* Personal Tasks Container */}
            <Card sx={{ 
              mb: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 152, 0, 0.2)',
              boxShadow: '0 8px 32px rgba(255, 152, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <Accordion 
                defaultExpanded 
                sx={{ 
                  '& .MuiAccordionSummary-root': {
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.05))',
                    borderBottom: '1px solid rgba(255, 152, 0, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(245, 124, 0, 0.08))',
                    }
                  },
                  '& .MuiAccordionDetails-root': {
                    p: 0
                  }
                }}
              >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: '#FF9800' }} />}
                sx={{ px: 3, py: 2 }}
              >
                <Box display="flex" alignItems="center">
                  <Person sx={{ mr: 2, color: '#FF9800', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Personal Tasks Data ({filteredPersonalCollected.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {filteredPersonalCollected.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }
                        }}>
                          <TableCell>Task Title</TableCell>
                          <TableCell>Completion Date</TableCell>
                          <TableCell>Action Type</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPersonalCollected.map((item) => (
                          <TableRow 
                            key={item.id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(245, 124, 0, 0.02))',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              transition: 'all 0.3s ease',
                              '&:nth-of-type(even)': {
                                background: 'rgba(255, 152, 0, 0.02)'
                              }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                {item.taskTitle || 'Untitled Task'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(item.completionDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.actionType || 'Task Completed'}
                                sx={{ 
                                  background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {renderUserInfo(item.userId || item.completedBy || '')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={item.verificationStatus === 'verified' ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={item.verificationStatus === 'verified' ? <CheckCircle /> : <Verified />}
                                onClick={() => handleVerifyClick(item)}
                                sx={{ 
                                  minWidth: 100,
                                  background: item.verificationStatus === 'verified' 
                                    ? 'linear-gradient(45deg, #4CAF50, #45a049)'
                                    : 'transparent',
                                  borderColor: '#FF9800',
                                  color: item.verificationStatus === 'verified' ? 'white' : '#FF9800',
                                  '&:hover': {
                                    background: item.verificationStatus === 'verified' 
                                      ? 'linear-gradient(45deg, #45a049, #3d8b40)'
                                      : 'rgba(255, 152, 0, 0.1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {item.verificationStatus === 'verified' ? 'View Data' : 'Verify'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Person sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No Personal Tasks Completed Yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Personal tasks will appear here once team members complete their assignments
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
              </Accordion>
            </Card>
        </Box>
      </Fade>

      {/* Modern Verify Data Dialog */}
      <Dialog 
        open={verifyDialogOpen} 
        onClose={handleCloseVerifyDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: selectedData?.verificationStatus === 'verified' 
            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          py: 3
        }}>
          <Box display="flex" alignItems="center" justifyContent="center">
            {selectedData?.verificationStatus === 'verified' ? (
              <CheckCircle sx={{ mr: 2, fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            ) : (
              <Verified sx={{ mr: 2, fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            )}
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {selectedData?.verificationStatus === 'verified' ? 'View Verified Data' : 'Verify Collected Data'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedData && renderCollectedData(selectedData)}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.02))',
          borderTop: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <Button 
            onClick={handleCloseVerifyDialog} 
            sx={{
              background: 'linear-gradient(45deg, #9E9E9E, #757575)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #757575, #616161)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(158, 158, 158, 0.3)'
              },
              transition: 'all 0.3s ease',
              fontWeight: 600,
              px: 3
            }}
          >
            Close
          </Button>
          {selectedData?.verificationStatus !== 'verified' && (
            <Button 
              variant="contained" 
              startIcon={<Verified />}
              onClick={() => handleVerifyTask(selectedData!)}
              disabled={!selectedData}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049, #3d8b40)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                },
                transition: 'all 0.3s ease',
                fontWeight: 600,
                px: 3
              }}
            >
              Verify
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 