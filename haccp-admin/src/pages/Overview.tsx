import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Fade,
  Stack,
  Chip
} from '@mui/material';
import { Dashboard, TrendingUp, CalendarToday, Assignment, CheckCircle, Schedule, Assessment } from '@mui/icons-material';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface TaskCounts {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  oneTime: number;
  assignedToTeam: number;
}

interface MonitoringSummary {
  totalDaily: number;
  totalWeekly: number;
  totalMonthly: number;
  totalYearly: number;
  totalOneTime: number;
  totalAssignedToTeam: number;
  totalTasks: number;
  totalCompletedToday: number;
}

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [monitoringSummary, setMonitoringSummary] = useState<MonitoringSummary>({
    totalDaily: 0,
    totalWeekly: 0,
    totalMonthly: 0,
    totalYearly: 0,
    totalOneTime: 0,
    totalAssignedToTeam: 0,
    totalTasks: 0,
    totalCompletedToday: 0
  });

  useEffect(() => {
    const fetchCompanyCode = async () => {
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
    fetchCompanyCode();
  }, []);

  useEffect(() => {
    if (companyCode) {
      fetchMonitoringSummary();
    }
  }, [companyCode]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchMonitoringSummary = async () => {
    if (!companyCode) return;
    
    try {
      setLoading(true);
      
      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Fetch all detailed monitoring tasks
      const detailedQuery = query(collection(db, 'companies', companyCode, 'detailedMonitoring'));
      const detailedSnapshot = await getDocs(detailedQuery);
      
      // Fetch all checklist monitoring tasks
      const checklistQuery = query(collection(db, 'companies', companyCode, 'checklistMonitoring'));
      const checklistSnapshot = await getDocs(checklistQuery);
      
      // Fetch all team member tasks
      const teamMemberQuery = query(collection(db, 'companies', companyCode, 'teamMemberTasks'));
      const teamMemberSnapshot = await getDocs(teamMemberQuery);
      
      // Process the data to get today's counts
      const allTasks = [
        ...detailedSnapshot.docs.map(doc => doc.data()),
        ...checklistSnapshot.docs.map(doc => doc.data()),
        ...teamMemberSnapshot.docs.map(doc => doc.data())
      ];
      
      let totalDaily = 0;
      let totalWeekly = 0;
      let totalMonthly = 0;
      let totalYearly = 0;
      let totalOneTime = 0;
      let totalAssignedToTeam = 0;
      
      allTasks.forEach(task => {
        const freq = (task.frequency || '').toLowerCase();
        const dueDate = task.dueDate;
        
        // Check if this task is due today
        let isDueToday = false;
        
        if (freq === 'once a day' || freq === 'daily') {
          // Daily tasks are due every day
          isDueToday = true;
          totalDaily++;
        } else if (freq === 'once a week' || freq === 'weekly') {
          // Weekly tasks are due on the same weekday
          if (dueDate) {
            const due = new Date(dueDate);
            isDueToday = due.getDay() === today.getDay();
            if (isDueToday) totalWeekly++;
          }
        } else if (freq === 'once a month' || freq === 'monthly') {
          // Monthly tasks are due on the same day of month
          if (dueDate) {
            const due = new Date(dueDate);
            isDueToday = due.getDate() === today.getDate();
            if (isDueToday) totalMonthly++;
          }
        } else if (freq === 'once a year' || freq === 'yearly') {
          // Yearly tasks are due on the same month and day
          if (dueDate) {
            const due = new Date(dueDate);
            isDueToday = due.getDate() === today.getDate() && due.getMonth() === today.getMonth();
            if (isDueToday) totalYearly++;
          }
        } else if (freq.includes('one-time') || freq.includes('one time')) {
          // One-time tasks are due on their specific due date
          if (dueDate) {
            isDueToday = dueDate === todayString;
            if (isDueToday) totalOneTime++;
          }
        }
        
        // Check if assigned to team (only count if due today)
        if (isDueToday && (task.assignedToTeam || task.teamId || task.teamMemberId)) {
          totalAssignedToTeam++;
        }
      });
      
      const totalTasks = totalDaily + totalWeekly + totalMonthly + totalYearly + totalOneTime;
      
      // Fetch completed tasks from today (from Verification tab collections)
      let totalCompletedToday = 0;
      
      try {
        // Fetch checklist completed tasks
        const checklistCompletedQuery = query(collection(db, 'companies', companyCode, 'checklistCollected'));
        const checklistCompletedSnapshot = await getDocs(checklistCompletedQuery);
        
        // Fetch detailed completed tasks
        const detailedCompletedQuery = query(collection(db, 'companies', companyCode, 'detailedCollected'));
        const detailedCompletedSnapshot = await getDocs(detailedCompletedQuery);
        
        // Fetch personal completed tasks
        const personalCompletedQuery = query(collection(db, 'companies', companyCode, 'personalCollected'));
        const personalCompletedSnapshot = await getDocs(personalCompletedQuery);
        
        // Count tasks completed today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        const allCompletedTasks = [
          ...checklistCompletedSnapshot.docs.map(doc => doc.data()),
          ...detailedCompletedSnapshot.docs.map(doc => doc.data()),
          ...personalCompletedSnapshot.docs.map(doc => doc.data())
        ];
        
        allCompletedTasks.forEach(task => {
          const completionDate = task.completionDate || task.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0];
          if (completionDate === todayString) {
            totalCompletedToday++;
          }
        });
      } catch (error) {
        console.error('Error fetching completed tasks:', error);
      }
      
      setMonitoringSummary({
        totalDaily,
        totalWeekly,
        totalMonthly,
        totalYearly,
        totalOneTime,
        totalAssignedToTeam,
        totalTasks,
        totalCompletedToday
      });
      
    } catch (error) {
      console.error('Error fetching monitoring summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'default';
    if (count <= 5) return 'success';
    if (count <= 15) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if there's no data
  const hasNoData = monitoringSummary.totalTasks === 0 && 
                    monitoringSummary.totalCompletedToday === 0;

  if (hasNoData) {
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
                <Dashboard sx={{ 
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
                  Overview Dashboard
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                Your comprehensive monitoring task summary
              </Typography>
            </Box>
          </Card>
        </Fade>

        {/* Modern No Data Message */}
        <Fade in timeout={800}>
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
                  fontSize: '4rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>
                  📊
                </Typography>
                <Typography variant="h4" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 700, 
                  mb: 2,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Welcome to Your Dashboard!
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 400,
                  mb: 4,
                  lineHeight: 1.6
                }}>
                  This is your first time here. Your dashboard will show monitoring tasks, progress tracking, and key metrics once you start creating and assigning tasks.
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 4, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Typography variant="h6" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 600, 
                  mb: 3
                }}>
                  To get started:
                </Typography>
                <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)'
                    }} />
                    <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                      Create monitoring tasks in the "Manage Monitoring" section
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)'
                    }} />
                    <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                      Assign tasks to team members in "Teams Management"
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)'
                    }} />
                    <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                      Set up your company profile in "Settings"
                    </Typography>
                  </Box>
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
              <Dashboard sx={{ 
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
                Overview Dashboard
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Your comprehensive monitoring task summary
            </Typography>
          </Box>
        </Card>
      </Fade>



      {/* Modern Progress Card */}
      <Fade in timeout={800}>
        <Card sx={{ 
          mb: 3, 
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
                <Assessment sx={{ color: '#667eea', fontSize: 28 }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#2c3e50',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Task Completion Progress
                </Typography>
              </Box>
            }
          />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 500,
                  fontSize: '1rem'
                }}>
                  Progress: {monitoringSummary.totalCompletedToday} of {monitoringSummary.totalTasks} tasks completed
                </Typography>
                <Chip 
                  label={`${monitoringSummary.totalTasks > 0 ? Math.round((monitoringSummary.totalCompletedToday / monitoringSummary.totalTasks) * 100) : 0}%`}
                  sx={{ 
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={monitoringSummary.totalTasks > 0 ? (monitoringSummary.totalCompletedToday / monitoringSummary.totalTasks) * 100 : 0}
                sx={{ 
                  height: 16, 
                  borderRadius: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 8,
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)'
                  }
                }}
              />
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'center' }}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                minWidth: '120px'
              }}>
                <CheckCircle sx={{ color: '#4CAF50', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50', mb: 0.5 }}>
                  {monitoringSummary.totalCompletedToday}
                </Typography>
                <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                  Completed
                </Typography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                minWidth: '120px'
              }}>
                <Schedule sx={{ color: '#FF9800', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800', mb: 0.5 }}>
                  {monitoringSummary.totalTasks - monitoringSummary.totalCompletedToday}
                </Typography>
                <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                  Remaining
                </Typography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                border: '1px solid rgba(33, 150, 243, 0.2)',
                minWidth: '120px'
              }}>
                <Assignment sx={{ color: '#2196F3', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196F3', mb: 0.5 }}>
                  {monitoringSummary.totalTasks}
                </Typography>
                <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                  Total Due
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Fade>





      {/* Modern Welcome Message */}
      <Fade in timeout={1000}>
        <Card sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                color: '#2c3e50',
                mb: 2,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                📊 Dashboard Overview
              </Typography>
            </Box>
            
            <Stack spacing={3}>
              <Typography variant="body1" sx={{ 
                color: '#2c3e50', 
                fontWeight: 400,
                fontSize: '1.1rem',
                lineHeight: 1.6,
                textAlign: 'center'
              }}>
                Welcome to your comprehensive monitoring dashboard. This page provides a high-level summary of today's monitoring planning tasks and completion status.
              </Typography>
              
              <Box sx={{ 
                p: 3, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Typography variant="body2" sx={{ 
                  color: '#2c3e50', 
                  fontWeight: 500,
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}>
                  The progress indicators above show today's task counts and completion status. The total sum ({monitoringSummary.totalTasks}) represents 
                  all tasks due today across daily, weekly, monthly, yearly, and one-time frequencies. 
                  Use this overview to quickly assess today's workload and completion progress.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
