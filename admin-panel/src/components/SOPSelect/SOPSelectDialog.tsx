import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, ListItemButton, Typography, Box, Chip, Checkbox } from '@mui/material';

export interface SOP {
  id: string;
  title: string;
  description?: string;
  version?: string;
}

interface SOPSelectDialogProps {
  open: boolean;
  sops: SOP[];
  selected: SOP[];
  onClose: () => void;
  onSelect: (sops: SOP[]) => void;
}

const SOPSelectDialog: React.FC<SOPSelectDialogProps> = ({ open, sops, selected, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [selectedSOPs, setSelectedSOPs] = useState<SOP[]>(selected || []);

  useEffect(() => {
    setSelectedSOPs(selected || []);
  }, [selected, open]);

  const filteredSOPs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sops;
    return sops.filter(sop =>
      sop.title.toLowerCase().includes(q) ||
      (sop.description && sop.description.toLowerCase().includes(q))
    );
  }, [search, sops]);

  const isChecked = (sop: SOP) => selectedSOPs.some(sel => sel.id === sop.id);

  const handleToggle = (sop: SOP) => {
    if (isChecked(sop)) {
      setSelectedSOPs(selectedSOPs.filter(sel => sel.id !== sop.id));
    } else {
      setSelectedSOPs([...selectedSOPs, sop]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select SOPs</DialogTitle>
      <DialogContent>
        <TextField
          label="Search SOPs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          margin="normal"
          autoFocus
        />
        <List>
          {filteredSOPs.length === 0 && (
            <ListItem>
              <ListItemText primary={<Typography color="textSecondary">No SOPs found.</Typography>} />
            </ListItem>
          )}
          {filteredSOPs.map(sop => (
            <ListItemButton key={sop.id} onClick={() => handleToggle(sop)}>
              <Checkbox
                checked={isChecked(sop)}
                tabIndex={-1}
                disableRipple
                onChange={() => handleToggle(sop)}
                onClick={e => e.stopPropagation()}
              />
              <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600 }}>{sop.title}</Typography>
                  {sop.version && <Chip label={`v${sop.version}`} size="small" sx={{ ml: 1, fontSize: '0.7rem' }} />}
                </Box>}
                secondary={sop.description}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSelect(selectedSOPs)} disabled={selectedSOPs.length === 0}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SOPSelectDialog; 