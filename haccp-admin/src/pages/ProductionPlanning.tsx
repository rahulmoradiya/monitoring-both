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
  const [taskCounts, setTaskCounts] = useState<{[key: string]: {detailed: number, checklist: number, extra: number}}>({});

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
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Fetch detailed tasks
      const detailedQuery = query(
        collection(db, 'companies', companyCode, 'detailedMonitoring'),
        where('dueDate', '>=', startOfMonth.toISOString().split('T')[0]),
        where('dueDate', '<=', endOfMonth.toISOString().split('T')[0])
      );
      const detailedSnapshot = await getDocs(detailedQuery);
      
      // Fetch checklist tasks
      const checklistQuery = query(
        collection(db, 'companies', companyCode, 'checklistMonitoring'),
        where('dueDate', '>=', startOfMonth.toISOString().split('T')[0]),
        where('dueDate', '<=', endOfMonth.toISOString().split('T')[0])
      );
      const checklistSnapshot = await getDocs(checklistQuery);
      
      // Fetch team member tasks
      const teamMemberQuery = query(
        collection(db, 'companies', companyCode, 'teamMemberTasks'),
        where('dueDate', '>=', startOfMonth.toISOString().split('T')[0]),
        where('dueDate', '<=', endOfMonth.toISOString().split('T')[0])
      );
      const teamMemberSnapshot = await getDocs(teamMemberQuery);
      
      // Process the data
      const counts: {[key: string]: {detailed: number, checklist: number, extra: number}} = {};
      
      // Process detailed tasks
      const onceADayDetailedTasks: any[] = [];
      const regularDetailedTasks: any[] = [];
      
      detailedSnapshot.docs.forEach(doc => {
        const task = doc.data();
        
        // Separate "Once a day" tasks from regular tasks
        if (task.frequency === 'Once a day') {
          onceADayDetailedTasks.push(task);
        } else {
          regularDetailedTasks.push(task);
        }
      });
      
      // Process regular detailed tasks (with dueDate)
      regularDetailedTasks.forEach(task => {
        const originalDate = task.dueDate;
        if (originalDate) {
          // Check if the original date is a weekend
          const originalDateObj = new Date(originalDate);
          const isWeekend = weekendDays.includes(originalDateObj.getDay());
          
          // If it's a weekend, move to last working day, otherwise keep original date
          const displayDate = isWeekend ? getLastWorkingDay(originalDate) : originalDate;
          
          if (!counts[displayDate]) counts[displayDate] = { detailed: 0, checklist: 0, extra: 0 };
          counts[displayDate].detailed++;
        }
      });
      
      // Process "Once a day" detailed tasks - add to weekdays starting from their dueDate
      if (onceADayDetailedTasks.length > 0) {
        const days = getDaysInMonth(currentYear, currentMonth);
        
        days.forEach(day => {
          if (day) {
            const dateString = day.toISOString().split('T')[0];
            const isWeekend = weekendDays.includes(day.getDay());
            
            // Count how many "Once a day" detailed tasks should be active on this date
            let activeTasksCount = 0;
            
            onceADayDetailedTasks.forEach(task => {
              const taskDueDate = task.dueDate;
              if (taskDueDate && dateString >= taskDueDate) {
                // Task is active from its dueDate onwards
                activeTasksCount++;
              }
            });
            
            // Only add to weekdays (not weekends) and only if there are active tasks
            if (!isWeekend && activeTasksCount > 0) {
              if (!counts[dateString]) counts[dateString] = { detailed: 0, checklist: 0, extra: 0 };
              counts[dateString].detailed += activeTasksCount;
            }
          }
        });
        
        // Debug logging for "Once a day" detailed tasks
        console.log(`Found ${onceADayDetailedTasks.length} "Once a day" detailed tasks`);
        onceADayDetailedTasks.forEach(task => {
          console.log(`Task: ${task.title || 'Untitled'}, DueDate: ${task.dueDate}`);
        });
      }
      
      // Process checklist tasks
      const onceADayTasks: any[] = [];
      const regularChecklistTasks: any[] = [];
      
      checklistSnapshot.docs.forEach(doc => {
        const task = doc.data();
        
        // Separate "Once a day" tasks from regular tasks
        if (task.frequency === 'Once a day') {
          onceADayTasks.push(task);
        } else {
          regularChecklistTasks.push(task);
        }
      });
      
      // Process regular checklist tasks (with dueDate)
      regularChecklistTasks.forEach(task => {
        const originalDate = task.dueDate;
        if (originalDate) {
          // Check if the original date is a weekend
          const originalDateObj = new Date(originalDate);
          const isWeekend = weekendDays.includes(originalDateObj.getDay());
          
          // If it's a weekend, move to last working day, otherwise keep original date
          const displayDate = isWeekend ? getLastWorkingDay(originalDate) : originalDate;
          
          if (!counts[displayDate]) counts[displayDate] = { detailed: 0, checklist: 0, extra: 0 };
          counts[displayDate].checklist++;
        }
      });
      
      // Process "Once a day" tasks - add to weekdays starting from their dueDate
      if (onceADayTasks.length > 0) {
        const days = getDaysInMonth(currentYear, currentMonth);
        
        days.forEach(day => {
          if (day) {
            const dateString = day.toISOString().split('T')[0];
            const isWeekend = weekendDays.includes(day.getDay());
            
            // Count how many "Once a day" tasks should be active on this date
            let activeTasksCount = 0;
            
            onceADayTasks.forEach(task => {
              const taskDueDate = task.dueDate;
              if (taskDueDate && dateString >= taskDueDate) {
                // Task is active from its dueDate onwards
                activeTasksCount++;
              }
            });
            
            // Only add to weekdays (not weekends) and only if there are active tasks
            if (!isWeekend && activeTasksCount > 0) {
              if (!counts[dateString]) counts[dateString] = { detailed: 0, checklist: 0, extra: 0 };
              counts[dateString].checklist += activeTasksCount;
            }
          }
        });
        
        // Debug logging for "Once a day" tasks
        console.log(`Found ${onceADayTasks.length} "Once a day" checklist tasks`);
        onceADayTasks.forEach(task => {
          console.log(`Task: ${task.title || 'Untitled'}, DueDate: ${task.dueDate}`);
        });
      }
      
      // Process team member tasks (as extra)
      teamMemberSnapshot.docs.forEach(doc => {
        const task = doc.data();
        const originalDate = task.dueDate;
        if (originalDate) {
          // Check if the original date is a weekend
          const originalDateObj = new Date(originalDate);
          const isWeekend = weekendDays.includes(originalDateObj.getDay());
          
          // If it's a weekend, move to last working day, otherwise keep original date
          const displayDate = isWeekend ? getLastWorkingDay(originalDate) : originalDate;
          
          // Debug logging
          console.log(`Task: ${task.title || 'Untitled'}, Original: ${originalDate}, IsWeekend: ${isWeekend}, Display: ${displayDate}`);
          
          if (!counts[displayDate]) counts[displayDate] = { detailed: 0, checklist: 0, extra: 0 };
          counts[displayDate].extra++;
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
                      const dayTaskCounts = taskCounts[dateString] || { detailed: 0, checklist: 0, extra: 0 };
                      
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
                          
                          {/* Task Counts - Only show for non-weekend days */}
                          {!isWeekend && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                TASKS
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                <Typography variant="caption" color="primary">
                                  Detailed: {dayTaskCounts.detailed}
                                </Typography>
                                <Typography variant="caption" color="secondary">
                                  Checklist: {dayTaskCounts.checklist}
                                </Typography>
                                <Typography variant="caption" color="warning.main">
                                  Extra: {dayTaskCounts.extra}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          
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