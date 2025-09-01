import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { Dashboard, TrendingUp, CalendarToday, Assignment } from '@mui/icons-material';
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
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Dashboard sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Overview
          </Typography>
        </Box>

        {/* No Data Message */}
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" sx={{ color: 'text.secondary', mb: 2 }}>
              📊
            </Typography>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
              Welcome to Your Dashboard!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This is your first time here. Your dashboard will show monitoring tasks, progress tracking, and key metrics once you start creating and assigning tasks.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              To get started:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                • Create monitoring tasks in the "Manage Monitoring" section
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Assign tasks to team members in "Teams Management"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Set up your company profile in "Settings"
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Dashboard sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Overview
        </Typography>
      </Box>



      {/* Progress Bar Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mr: 2 }}>
            📊 Task Completion Progress
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress: {monitoringSummary.totalCompletedToday} of {monitoringSummary.totalTasks} tasks completed
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {monitoringSummary.totalTasks > 0 ? Math.round((monitoringSummary.totalCompletedToday / monitoringSummary.totalTasks) * 100) : 0}%
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={monitoringSummary.totalTasks > 0 ? (monitoringSummary.totalCompletedToday / monitoringSummary.totalTasks) * 100 : 0}
            sx={{ 
              height: 12, 
              borderRadius: 6,
              bgcolor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                bgcolor: 'success.main'
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              {monitoringSummary.totalCompletedToday}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
            <Typography variant="h6" sx={{ fontWeight: '700', color: 'warning.main' }}>
              {monitoringSummary.totalTasks - monitoringSummary.totalCompletedToday}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Remaining
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '100px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
              {monitoringSummary.totalTasks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Due
            </Typography>
          </Box>
        </Box>
      </Paper>





      {/* Welcome Message */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Welcome to the overview dashboard. This page provides a high-level summary of today's monitoring planning tasks.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The summary cards above show today's task counts and completion status. The total sum ({monitoringSummary.totalTasks}) represents 
          all tasks due today across daily, weekly, monthly, yearly, and one-time frequencies. 
          Use this overview to quickly assess today's workload and completion progress.
        </Typography>
      </Paper>
    </Box>
  );
}
