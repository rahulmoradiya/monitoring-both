import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  Today, 
  ChevronLeft, 
  ChevronRight,
  PlayArrow,
  Stop,
  Build,
  Event,
  Warning
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface ProductionDay {
  id?: string;
  date: string;
  status: 'running' | 'not-running' | 'partial' | 'maintenance';
  capacity?: number;
  notes?: string;
  shift?: 'morning' | 'afternoon' | 'night' | 'all';
  reason?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

const PRODUCTION_STATUSES = [
  { value: 'running', label: 'Running', color: 'success', icon: <PlayArrow /> },
  { value: 'not-running', label: 'Not Running', color: 'error', icon: <Stop /> },
  { value: 'partial', label: 'Partial Production', color: 'warning', icon: <Warning /> },
  { value: 'maintenance', label: 'Maintenance', color: 'info', icon: <Build /> }
];



export default function ProductionPlanning() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [productionDays, setProductionDays] = useState<ProductionDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ProductionDay | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [weekendDialogOpen, setWeekendDialogOpen] = useState(false);
  const [companyCode, setCompanyCode] = useState<string>('');
  const [weekendDays, setWeekendDays] = useState<number[]>([0, 6]); // 0=Sunday, 6=Saturday
  // Update taskCounts state type
  const [taskCounts, setTaskCounts] = useState<{[key: string]: {
    daily: number,
    weekly: number,
    monthly: number,
    yearly: number,
    oneTime: number,
    assignedToTeam: number
  }}>({});

  // Get current month/year for display
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    // Get company code from current user
    const fetchCompanyCode = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collection(db, 'companies'));
        for (const companyDoc of usersSnap.docs) {
          const usersCol = await getDocs(collection(db, 'companies', companyDoc.id, 'users'));
          const userDoc = usersCol.docs.find(doc => doc.data().uid === user.uid);
          if (userDoc) {
            setCompanyCode(companyDoc.id);
            break;
          }
        }
      }
    };
    fetchCompanyCode();
  }, []);

  useEffect(() => {
    if (companyCode) {
      fetchProductionDays();
      fetchTaskCounts();
    }
  }, [companyCode, currentDate]);

  // Helper function to get the last working day before a given date
  const getLastWorkingDay = (date: string) => {
    // Create date in local timezone to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day); // month is 0-indexed
    let currentDate = new Date(targetDate);
    
    console.log(`Starting with date: ${date}, weekendDays: [${weekendDays}]`);
    console.log(`Target date day of week: ${targetDate.getDay()}`);
    
    // Keep going back until we find a working day
    while (weekendDays.includes(currentDate.getDay())) {
      console.log(`Date ${currentDate.toISOString().split('T')[0]} (day ${currentDate.getDay()}) is weekend, moving back`);
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Debug logging
    console.log(`Final result: Moving from ${date} to ${currentDate.toISOString().split('T')[0]}`);
    
    return currentDate.toISOString().split('T')[0];
  };

  const fetchTaskCounts = async () => {
    if (!companyCode) return;
    try {
      // Fetch all detailed tasks (no date filter)
      const detailedQuery = query(
        collection(db, 'companies', companyCode, 'detailedMonitoring')
      );
      const detailedSnapshot = await getDocs(detailedQuery);
      // Fetch all checklist tasks (no date filter)
      const checklistQuery = query(
        collection(db, 'companies', companyCode, 'checklistMonitoring')
      );
      const checklistSnapshot = await getDocs(checklistQuery);
      // Fetch all team member tasks (no date filter)
      const teamMemberQuery = query(
        collection(db, 'companies', companyCode, 'teamMemberTasks')
      );
      const teamMemberSnapshot = await getDocs(teamMemberQuery);
      // Process the data
      const counts: {[key: string]: {
        daily: number,
        weekly: number,
        monthly: number,
        yearly: number,
        oneTime: number,
        assignedToTeam: number
      }} = {};
      // Helper to ensure date key exists
      const ensureDate = (date: string) => {
        if (!counts[date]) counts[date] = {
          daily: 0, weekly: 0, monthly: 0, yearly: 0, oneTime: 0, assignedToTeam: 0
        };
      };
      // Helper to move to last working day if weekend
      const getDisplayDate = (date: string) => {
        const d = new Date(date);
        return weekendDays.includes(d.getDay()) ? getLastWorkingDay(date) : date;
      };
      // Process detailed and checklist tasks
      const allTasks = [
        ...detailedSnapshot.docs.map(doc => doc.data()),
        ...checklistSnapshot.docs.map(doc => doc.data())
      ];
      allTasks.forEach(task => {
        const freq = (task.frequency || '').toLowerCase();
        const dueDate = task.dueDate;
        if (!dueDate) return;
        // For each frequency, increment the correct days
        if (freq === 'once a day') {
          // Add to every day from dueDate onwards (skip weekends)
          const days = getDaysInMonth(currentYear, currentMonth);
          days.forEach(day => {
            if (day) {
              const dateString = day.toISOString().split('T')[0];
              if (dateString >= dueDate) {
                ensureDate(dateString);
                counts[dateString].daily++;
              }
            }
          });
        } else if (freq === 'once a week') {
          // Add to the same weekday as dueDate, every week
          const due = new Date(dueDate);
          const days = getDaysInMonth(currentYear, currentMonth);
          days.forEach(day => {
            if (day && day.getDay() === due.getDay() && day >= due) {
              const dateString = day.toISOString().split('T')[0];
              ensureDate(dateString);
              counts[dateString].weekly++;
            }
          });
        } else if (freq === 'once a month') {
          // Add to the same day of month as dueDate (every month, regardless of dueDate, using date parts)
          const dueParts = dueDate.split('-').map(Number); // [year, month, day]
          const days = getDaysInMonth(currentYear, currentMonth);
          days.forEach(day => {
            if (day && day.getDate() === dueParts[2]) {
              const dateString = day.toISOString().split('T')[0];
              ensureDate(dateString);
              counts[dateString].monthly++;
            }
          });
        } else if (freq === 'once a year') {
          // Add to the same month and day as dueDate (every year, regardless of dueDate, using date parts)
          const dueParts = dueDate.split('-').map(Number); // [year, month, day]
          const days = getDaysInMonth(currentYear, currentMonth);
          days.forEach(day => {
            if (day && day.getDate() === dueParts[2] && (currentMonth === (dueParts[1] - 1))) {
              const dateString = day.toISOString().split('T')[0];
              ensureDate(dateString);
              counts[dateString].yearly++;
            }
          });
        } else if (freq === 'one-time task' || freq === 'one time task' || freq === 'one-time' || freq === 'one time') {
          // Add to the dueDate (move to last working day if weekend)
          const displayDate = getDisplayDate(dueDate);
          ensureDate(displayDate);
          counts[displayDate].oneTime++;
        }
      });
      // Process team member tasks (assigned to team)
      teamMemberSnapshot.docs.forEach(doc => {
        const task = doc.data();
        const originalDate = task.dueDate;
        if (originalDate) {
          const displayDate = getDisplayDate(originalDate);
          ensureDate(displayDate);
          counts[displayDate].assignedToTeam++;
        }
      });
      setTaskCounts(counts);
    } catch (error) {
      console.error('Error fetching task counts:', error);
    }
  };

  const fetchProductionDays = async () => {
    if (!companyCode) return;
    
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const q = query(
        collection(db, 'companies', companyCode, 'productionPlanning'),
        where('date', '>=', startOfMonth.toISOString().split('T')[0]),
        where('date', '<=', endOfMonth.toISOString().split('T')[0])
      );
      
      const querySnapshot = await getDocs(q);
      const days = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductionDay[];
      
      setProductionDays(days);
    } catch (error) {
      console.error('Error fetching production days:', error);
    }
  };

  const handleSaveDay = async (dayData: ProductionDay) => {
    if (!companyCode) return;
    
    try {
      const user = auth.currentUser;
      const now = new Date();
      
      if (dayData.id) {
        // Update existing day
        await updateDoc(doc(db, 'companies', companyCode, 'productionPlanning', dayData.id), {
          ...dayData,
          updatedAt: now.toISOString()
        });
      } else {
        // Create new day
        await addDoc(collection(db, 'companies', companyCode, 'productionPlanning'), {
          ...dayData,
          createdBy: user?.uid || '',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });
      }
      
      await fetchProductionDays();
      setEditDialogOpen(false);
      setSelectedDay(null);
    } catch (error) {
      console.error('Error saving production day:', error);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!companyCode) return;
    
    try {
      await deleteDoc(doc(db, 'companies', companyCode, 'productionPlanning', dayId));
      await fetchProductionDays();
      setEditDialogOpen(false);
      setSelectedDay(null);
    } catch (error) {
      console.error('Error deleting production day:', error);
    }
  };

  const applyWeekendSettings = async () => {
    if (!companyCode) return;
    
    try {
      const days = getDaysInMonth(currentYear, currentMonth);
      const user = auth.currentUser;
      const now = new Date();
      
      for (const day of days) {
        if (day) {
          const dateString = day.toISOString().split('T')[0];
          const existingDay = productionDays.find(d => d.date === dateString);
          const isWeekend = weekendDays.includes(day.getDay());
          
          if (!existingDay) {
            // Create new day with appropriate status
            await addDoc(collection(db, 'companies', companyCode, 'productionPlanning'), {
              date: dateString,
              status: isWeekend ? 'not-running' : 'running',
              notes: isWeekend ? 'Weekend' : '',
              createdBy: user?.uid || '',
              createdAt: now.toISOString(),
              updatedAt: now.toISOString()
            });
          }
        }
      }
      
      await fetchProductionDays();
    } catch (error) {
      console.error('Error applying weekend settings:', error);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getProductionDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return productionDays.find(day => day.date === dateString);
  };

  const getStatusColor = (status: string) => {
    const statusObj = PRODUCTION_STATUSES.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  const getStatusIcon = (status: string) => {
    const statusObj = PRODUCTION_STATUSES.find(s => s.value === status);
    return statusObj?.icon || <Event />;
  };

  const handleDateClick = (date: Date) => {
    const existingDay = getProductionDay(date);
    const isWeekend = weekendDays.includes(date.getDay());
    
    setSelectedDay(existingDay || {
      date: date.toISOString().split('T')[0],
      status: isWeekend ? 'not-running' : 'running',
      notes: isWeekend ? 'Weekend' : ''
    });
    setEditDialogOpen(true);
  };

  const renderMonthlyView = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {monthNames[currentMonth]} {currentYear}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => setWeekendDialogOpen(true)}
            >
              WEEKEND MANAGEMENT
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => fetchTaskCounts()}
            >
              REFRESH TASKS
            </Button>
            <IconButton onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1))}>
              <ChevronLeft />
            </IconButton>
            <Button 
              variant="outlined" 
              onClick={() => setCurrentDate(new Date())}
              startIcon={<Today />}
            >
              Today
            </Button>
            <IconButton onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1))}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Card key={day} sx={{ bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {day}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => (
            <Box key={index}>
              {day ? (
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f0f0f0' },
                    minHeight: 100,
                    border: weekendDays.includes(day.getDay()) ? '2px solid #ff9800' : 'none'
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <CardContent sx={{ py: 1, px: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      {day.getDate()}
                    </Typography>
                    {(() => {
                      const productionDay = getProductionDay(day);
                      const isWeekend = weekendDays.includes(day.getDay());
                      const dateString = day.toISOString().split('T')[0];
                      
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {/* Production Status */}
                          {productionDay && (
                            <Chip
                              label={productionDay.status}
                              color={getStatusColor(productionDay.status) as any}
                              size="small"
                              icon={getStatusIcon(productionDay.status)}
                            />
                          )}

                          {/* Frequency Tags - compact horizontal layout */}
                          <Box sx={{
                            mt: 0.5,
                            bgcolor: '#fafbfc',
                            borderRadius: 1,
                            p: 0.5,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', mr: 0.5 }}>
                              TASKS
                            </Typography>
                            <Chip label={`Daily: ${taskCounts[dateString]?.daily || 0}`} color="primary" size="small" />
                            <Chip label={`Weekly: ${taskCounts[dateString]?.weekly || 0}`} color="secondary" size="small" />
                            <Chip label={`Monthly: ${taskCounts[dateString]?.monthly || 0}`} color="info" size="small" />
                            <Chip label={`Yearly: ${taskCounts[dateString]?.yearly || 0}`} color="success" size="small" />
                            <Chip label={`One Time: ${taskCounts[dateString]?.oneTime || 0}`} color="warning" size="small" />
                            <Chip label={`Assigned to Team: ${taskCounts[dateString]?.assignedToTeam || 0}`} color="default" size="small" />
                          </Box>

                          {/* Weekend Label */}
                          {isWeekend && (!productionDay || !productionDay.notes?.includes('Weekend')) && (
                            <Typography variant="caption" color="warning.main">
                              Weekend
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ bgcolor: '#fafafa', minHeight: 100 }}>
                  <CardContent sx={{ py: 1, px: 1 }} />
                </Card>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Monitoring Planning
      </Typography>
      
      {renderMonthlyView()}

      {/* Status Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 3 }}>
        {PRODUCTION_STATUSES.map(status => (
          <Chip
            key={status.value}
            label={status.label}
            color={status.color as any}
            icon={status.icon}
            size="small"
          />
        ))}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDay?.id ? 'Edit Production Day' : 'Add Production Day'}
        </DialogTitle>
        <DialogContent>
          {selectedDay && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {new Date(selectedDay.date).toLocaleDateString()}
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Production Status</InputLabel>
                <Select
                  value={selectedDay.status}
                  label="Production Status"
                  onChange={(e) => setSelectedDay({ ...selectedDay, status: e.target.value as any })}
                >
                  {PRODUCTION_STATUSES.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status.icon}
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>



              <TextField
                label="Reason/Notes"
                value={selectedDay.notes || ''}
                onChange={(e) => setSelectedDay({ ...selectedDay, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedDay?.id && (
            <Button 
              color="error" 
              onClick={() => selectedDay.id && handleDeleteDay(selectedDay.id)}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => selectedDay && handleSaveDay(selectedDay)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Weekend Management Dialog */}
      <Dialog open={weekendDialogOpen} onClose={() => setWeekendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Weekend Management
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Select which days of the week should be treated as weekends. Weekend days will be marked as "Not Running" and other days as "Running" by default.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { value: 0, label: 'Sunday' },
                { value: 1, label: 'Monday' },
                { value: 2, label: 'Tuesday' },
                { value: 3, label: 'Wednesday' },
                { value: 4, label: 'Thursday' },
                { value: 5, label: 'Friday' },
                { value: 6, label: 'Saturday' }
              ].map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={weekendDays.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWeekendDays([...weekendDays, day.value]);
                        } else {
                          setWeekendDays(weekendDays.filter(d => d !== day.value));
                        }
                      }}
                    />
                  }
                  label={day.label}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeekendDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setWeekendDialogOpen(false);
              // Apply weekend settings to current month
              applyWeekendSettings();
            }}
          >
            Apply to Current Month
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 