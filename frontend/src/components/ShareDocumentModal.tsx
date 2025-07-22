import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { apiClient, type ShareDocumentRequest } from '../lib/api';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleShare = async () => {
    if (!email.trim()) {
      console.log('Share validation: Email address required');
      setMessage('Please enter an email address.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const shareData: ShareDocumentRequest = {
        email: email.trim(),
        permission: permission,
      };

      const response = await apiClient.shareDocument(documentId, shareData);

      if (response.error) {
        console.error('Share document error:', response.error);
        setMessage('Failed to share document. Please try again.');
      } else {
        setMessage(`Document shared with ${email} successfully!`);
        setEmail('');
        setTimeout(() => {
          onClose();
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Share document exception:', error);
      setMessage('Failed to share document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPermission('READ');
    setMessage('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Share Document
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ color: 'grey.500' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Share "{documentTitle}" with someone else
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address..."
            disabled={isLoading}
            variant="outlined"
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel id="permission-label">Permission Level</InputLabel>
            <Select
              labelId="permission-label"
              value={permission}
              label="Permission Level"
              onChange={(e) => setPermission(e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
              disabled={isLoading}
            >
              <MenuItem value="READ">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Read Only</Typography>
                  <Typography variant="caption" color="text.secondary">Can view the document</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="WRITE">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Write</Typography>
                  <Typography variant="caption" color="text.secondary">Can edit the document</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="ADMIN">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Admin</Typography>
                  <Typography variant="caption" color="text.secondary">Can edit and manage sharing</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {message && (
            <Alert 
              severity={message.includes('Failed') ? 'warning' : 'success'} 
              variant="outlined"
            >
              {message}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isLoading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleShare}
          disabled={isLoading || !email.trim()}
          variant="contained"
          color="primary"
        >
          {isLoading ? 'Sharing...' : 'Share Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDocumentModal;