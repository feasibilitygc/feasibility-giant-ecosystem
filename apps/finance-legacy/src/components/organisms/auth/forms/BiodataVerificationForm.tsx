'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Skeleton,
} from '@mui/material';
import { AuthApiService } from '@/lib/api/services/authService';
import { useCooperatives } from '@/lib/hooks/cooperative/useCooperatives';

const authApi = new AuthApiService();

import { isValidNigerianNumber } from '@/lib/utils/validationUtils';

interface BiodataVerificationFormProps {
  onStepComplete: () => void;
  /** Pre-selected cooperative ID (e.g. injected by the tenant context on a subdomain) */
  preselectedCooperativeId?: string;
}

export default function BiodataVerificationForm({
  onStepComplete,
  preselectedCooperativeId,
}: BiodataVerificationFormProps) {
  const [step, setStep] = useState<'select-coop' | 'verify' | 'validate'>(
    preselectedCooperativeId ? 'verify' : 'select-coop'
  );
  const [selectedCoopId, setSelectedCoopId] = useState(preselectedCooperativeId ?? '');
  const [coopError, setCoopError] = useState('');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    verificationCode: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    phoneNumber: '',
    verificationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const { data: cooperatives, isLoading: coopsLoading, isError: coopsError } = useCooperatives();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCoopNext = () => {
    if (!selectedCoopId) {
      setCoopError('Please select your cooperative before continuing.');
      return;
    }
    setCoopError('');
    setStep('verify');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phoneNumber.trim()) {
      setFieldErrors(prev => ({ ...prev, phoneNumber: 'Phone number is required' }));
      return;
    } else if (!isValidNigerianNumber(formData.phoneNumber.trim())) {
      setFieldErrors(prev => ({ ...prev, phoneNumber: 'Please enter a valid Nigerian phone number (e.g. 08031234567 or +2348031234567)' }));
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({ phoneNumber: '', verificationCode: '' });
    try {
      await authApi.verifyBiodata(formData.phoneNumber);
      setStep('validate');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.verificationCode.trim()) {
      setFieldErrors(prev => ({ ...prev, verificationCode: 'Verification code is required' }));
      return;
    } else if (formData.verificationCode.trim().length < 4) {
      setFieldErrors(prev => ({ ...prev, verificationCode: 'Verification code must be at least 4 characters' }));
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({ phoneNumber: '', verificationCode: '' });
    try {
      await authApi.validateOTP(formData.verificationCode);
      // Store selected cooperative for downstream account linking
      if (selectedCoopId) {
        sessionStorage.setItem('selected_cooperative_id', selectedCoopId);
      }
      onStepComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: Cooperative Selection ──
  if (step === 'select-coop') {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the cooperative you belong to. Your account will be linked to it upon verification.
        </Typography>

        {coopsLoading && (
          <>
            <Skeleton variant="rounded" height={56} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" />
          </>
        )}

        {coopsError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Could not load the cooperative list. Please refresh or try again later.
          </Alert>
        )}

        {!coopsLoading && !coopsError && (
          <FormControl fullWidth error={!!coopError} sx={{ mb: 2 }}>
            <InputLabel id="coop-select-label">Your Cooperative *</InputLabel>
            <Select
              labelId="coop-select-label"
              id="coop-select"
              value={selectedCoopId}
              label="Your Cooperative *"
              onChange={(e) => {
                setSelectedCoopId(e.target.value);
                setCoopError('');
              }}
            >
              {cooperatives?.map((coop) => (
                <MenuItem key={coop.id} value={coop.id}>
                  {coop.name}
                </MenuItem>
              ))}
            </Select>
            {coopError && <FormHelperText>{coopError}</FormHelperText>}
          </FormControl>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleCoopNext}
          disabled={coopsLoading}
          sx={{ mt: 1, mb: 2 }}
        >
          Continue
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={() => router.push('/auth/login')}
        >
          Back to Login
        </Button>
      </Box>
    );
  }

  // ── Step 2: OTP Validation ──
  if (step === 'validate') {
    return (
      <Box component="form" onSubmit={handleValidate} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          name="verificationCode"
          label="Verification Code"
          type="text"
          id="verificationCode"
          value={formData.verificationCode}
          onChange={handleChange}
          disabled={loading}
          error={!!fieldErrors.verificationCode}
          helperText={fieldErrors.verificationCode}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify Code'}
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={() => setStep('verify')}
          disabled={loading}
        >
          Back to Previous Step
        </Button>
      </Box>
    );
  }

  // ── Step 1: Phone Number Entry ──
  return (
    <Box component="form" onSubmit={handleVerify} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        id="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        disabled={loading}
        error={!!fieldErrors.phoneNumber}
        helperText={fieldErrors.phoneNumber}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
      </Button>
      <Button
        fullWidth
        variant="text"
        onClick={() => {
          if (!preselectedCooperativeId) setStep('select-coop');
          else router.push('/auth/login');
        }}
        disabled={loading}
      >
        Back
      </Button>
    </Box>
  );
}