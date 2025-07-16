import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function Departments() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [companyCode, setCompanyCode] = useState<string>('');

  useEffect(() => {
    const fetchMeta = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersSnap = await getDocs(collection(db, 'companies', 'companyCode', 'users'));
        const userDoc = usersSnap.docs.find(doc => doc.data().uid === user.uid);
        if (userDoc) {
          setCompanyCode(userDoc.data().companyCode);
        }
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!companyCode) return;
    const fetchDepartments = async () => {
      const deptSnap = await getDocs(collection(db, 'companies', companyCode, 'departments'));
      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
    };
    fetchDepartments();
  }, [companyCode]);

  const handleAddDepartment = async () => {
    if (!newDept || !companyCode) return;
    await addDoc(collection(db, 'companies', companyCode, 'departments'), { name: newDept });
    setNewDept('');
    setDialogOpen(false);
    // Refresh list
    const deptSnap = await getDocs(collection(db, 'companies', companyCode, 'departments'));
    setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string })));
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Departments</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>Add Department</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map(dept => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Department</DialogTitle>
        <DialogContent>
          <TextField
            label="Department Name"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDepartment} variant="contained" disabled={!newDept}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 