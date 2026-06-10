"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Fade,
  Alert,
  AlertTitle,
  TextField,
  InputAdornment,
  Grid,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Language as LanguageIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  RocketLaunch as LaunchIcon,
} from "@mui/icons-material";
import { useCooperativeRegistration, type RegisterCooperativeInput } from "@/lib/hooks/cooperative/useCooperativeRegistration";
import { isValidEmail } from "@/lib/utils/validationUtils";

interface CooperativeFormData {
  name: string;
  registrationNumber: string;
  country: string;
  currency: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const initialFormData: CooperativeFormData = {
  name: "",
  registrationNumber: "",
  country: "Nigeria",
  currency: "NGN",
  subdomain: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

const steps = [
  { label: "Cooperative Info", icon: BusinessIcon, description: "Basic details" },
  { label: "Portal Subdomain", icon: LanguageIcon, description: "Your custom domain" },
  { label: "Admin Account", icon: AdminIcon, description: "Primary administrator" },
  { label: "Review & Launch", icon: CheckCircleIcon, description: "Review settings" },
];

export default function RegisterCooperativePage() {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CooperativeFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [createdCooperative, setCreatedCooperative] = useState<any>(null);

  const updateFormData = (data: Partial<CooperativeFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for updated fields
    const updatedFields = Object.keys(data);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => delete newErrors[field]);
      return newErrors;
    });
    if (submitError) {
      setSubmitError("");
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          newErrors.name = "Cooperative name is required";
        } else if (formData.name.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        }

        if (!formData.registrationNumber.trim()) {
          newErrors.registrationNumber = "Registration number is required";
        } else if (formData.registrationNumber.trim().length < 2) {
          newErrors.registrationNumber = "Registration number must be at least 2 characters";
        }

        if (!formData.country.trim()) {
          newErrors.country = "Country is required";
        } else if (formData.country.trim().length < 2) {
          newErrors.country = "Country must be at least 2 characters";
        }

        if (!formData.currency.trim()) {
          newErrors.currency = "Currency symbol/code is required";
        } else if (formData.currency.trim().length < 2) {
          newErrors.currency = "Currency must be at least 2 characters";
        }
        break;
      case 1:
        if (!formData.subdomain.trim()) {
          newErrors.subdomain = "Subdomain is required";
        } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
          newErrors.subdomain = "Subdomain can only contain lowercase letters, numbers, and dashes";
        }
        break;
      case 2:
        if (!formData.adminName.trim()) {
          newErrors.adminName = "Administrator name is required";
        } else if (formData.adminName.trim().length < 2) {
          newErrors.adminName = "Admin name must be at least 2 characters";
        }

        if (!formData.adminEmail.trim()) {
          newErrors.adminEmail = "Administrator email is required";
        } else if (!isValidEmail(formData.adminEmail.trim())) {
          newErrors.adminEmail = "Please enter a valid email address";
        }

        if (!formData.adminPassword) {
          newErrors.adminPassword = "Password is required";
        } else if (formData.adminPassword.length < 6) {
          newErrors.adminPassword = "Password must be at least 6 characters";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const registrationMutation = useCooperativeRegistration({
    onSuccess: (response) => {
      setCreatedCooperative(response.data);
      // Determine local vs production hostname
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const port = window.location.port ? `:${window.location.port}` : '';
      const domain = isLocalhost ? `localhost${port}` : 'feasibilityfinance.com';
      const protocol = window.location.protocol;
      
      setPortalUrl(`${protocol}//${formData.subdomain}.${domain}`);
      setCurrentStep(steps.length); // Advance past reviews to success screen
    },
    onError: (_, formattedError) => {
      setSubmitError(formattedError.message || "Failed to register cooperative. Please check your inputs.");
      if (formattedError.fieldErrors) {
        setErrors(formattedError.fieldErrors);
      }
    },
  });

  const handleSubmit = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setSubmitError("Please correct the errors in the previous steps first.");
      return;
    }

    const payload: RegisterCooperativeInput = {
      name: formData.name,
      registration_number: formData.registrationNumber,
      country: formData.country,
      currency: formData.currency,
      subdomain: formData.subdomain,
      admin_user: {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.adminPassword,
      },
    };

    registrationMutation.mutate(payload);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="600" color="primary">
                Cooperative Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provide the basic legal details for your credit union, thrift, or cooperative society.
              </Typography>
              <TextField
                label="Cooperative Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
              <TextField
                label="Business Registration Number (CAC #/Rc No)"
                fullWidth
                required
                value={formData.registrationNumber}
                onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
                error={!!errors.registrationNumber}
                helperText={errors.registrationNumber}
              />
              <Grid container spacing={2}>
                <Grid size={{xs: 12, sm:6}}>
                  <TextField
                    label="Country"
                    fullWidth
                    required
                    value={formData.country}
                    onChange={(e) => updateFormData({ country: e.target.value })}
                    error={!!errors.country}
                    helperText={errors.country}
                  />
                </Grid>
                <Grid size={{xs: 12, sm:6}}>
                  <TextField
                    label="Currency (e.g. NGN, USD)"
                    fullWidth
                    required
                    value={formData.currency}
                    onChange={(e) => updateFormData({ currency: e.target.value })}
                    error={!!errors.currency}
                    helperText={errors.currency}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Fade>
        );
      case 1:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="600" color="primary">
                Choose Your Subdomain
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your portal will be hosted at this address. Use your cooperative's acronym or short name (lowercase, numbers, and hyphens only).
              </Typography>
              <TextField
                label="Portal Subdomain"
                fullWidth
                required
                value={formData.subdomain}
                onChange={(e) => updateFormData({ subdomain: e.target.value.toLowerCase() })}
                error={!!errors.subdomain}
                helperText={errors.subdomain}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      .feasibilityfinance.com
                    </InputAdornment>
                  ),
                }}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Custom Domains</AlertTitle>
                After initial setup, you will be able to configure a fully custom CNAME domain (e.g., <code>portal.yourcoop.org</code>) from your admin dashboard settings.
              </Alert>
            </Stack>
          </Fade>
        );
      case 2:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="600" color="primary">
                Primary Admin Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Setup the main administrator profile. This account will have Super Admin access to manage members, approve loans, and configure settings.
              </Typography>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={formData.adminName}
                onChange={(e) => updateFormData({ adminName: e.target.value })}
                error={!!errors.adminName}
                helperText={errors.adminName}
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={formData.adminEmail}
                onChange={(e) => updateFormData({ adminEmail: e.target.value })}
                error={!!errors.adminEmail}
                helperText={errors.adminEmail}
              />
              <TextField
                label="Secure Password"
                type="password"
                fullWidth
                required
                value={formData.adminPassword}
                onChange={(e) => updateFormData({ adminPassword: e.target.value })}
                error={!!errors.adminPassword}
                helperText={errors.adminPassword}
              />
            </Stack>
          </Fade>
        );
      case 3:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="600" color="primary">
                Review and Launch
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please double check all settings before launching your cooperative portal.
              </Typography>
              
              <Box sx={{ bgcolor: "action.hover", p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🏢 {formData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Registration:</strong> {formData.registrationNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Location:</strong> {formData.country} ({formData.currency})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Subdomain Address:</strong> <code>{formData.subdomain}.feasibilityfinance.com</code>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>Super Admin:</strong> {formData.adminName} ({formData.adminEmail})
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                By launching, you will initialize this tenant portal. You will receive an email confirmation and can instantly log in to seed your cooperative settings.
              </Typography>
            </Stack>
          </Fade>
        );
      default:
        return null;
    }
  };

  const renderSuccessContent = () => {
    return (
      <Fade in timeout={500}>
        <Stack spacing={4} alignItems="center" sx={{ textAlign: "center", py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="success.main">
              Cooperative Onboarded Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The portal for <strong>{formData.name}</strong> is live and ready for members.
            </Typography>
          </Box>

          <Box sx={{ width: "100%", bgcolor: "success.light", p: 3, borderRadius: 3, opacity: 0.9 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="success.contrastText">
              YOUR PORTAL URL
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                {portalUrl}
              </a>
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ width: "100%", textAlign: "left", bgcolor: "action.hover", p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              🚀 Next Steps:
            </Typography>
            <Typography variant="body2">
              1. Click the link above to navigate to your new white-labeled cooperative portal.
            </Typography>
            <Typography variant="body2">
              2. Log in using your admin email: <strong>{formData.adminEmail}</strong>.
            </Typography>
            <Typography variant="body2">
              3. Go to the Settings panel to configure contribution amounts, loan terms, and invite staff.
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="large"
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<LaunchIcon />}
            sx={{
              px: 6,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            }}
          >
            Go to Portal
          </Button>
        </Stack>
      </Fade>
    );
  };

  const isSuccess = currentStep === steps.length;

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}12 100%)`,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            component={Link}
            href="/"
          >
            Feasibility Finance
          </Typography>
          {!isSuccess && (
            <Button component={Link} href="/" variant="text" startIcon={<ArrowBackIcon />}>
              Back to Home
            </Button>
          )}
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            position: "relative",
            overflow: "visible",
          }}
        >
          {registrationMutation.isPending && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(255,255,255,0.7)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                gap: 2,
              }}
            >
              <CircularProgress size={50} />
              <Typography variant="h6" fontWeight="600">
                Initializing Cooperative Portal...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Setting up databases, default roles, and styling configurations.
              </Typography>
            </Box>
          )}

          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            {!isSuccess && (
              <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight="800" align="center" gutterBottom>
                  Onboard Your Cooperative
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  Create a custom white-labeled savings and loan platform for your society.
                </Typography>

                <Box sx={{ width: "100%", mt: 4, display: { xs: "none", md: "block" } }}>
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {steps.map((step) => {
                      const StepIcon = step.icon;
                      return (
                        <Step key={step.label}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  bgcolor:
                                    currentStep >= steps.indexOf(step)
                                      ? "primary.main"
                                      : "action.disabledBackground",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <StepIcon sx={{ fontSize: 18 }} />
                              </Box>
                            )}
                          >
                            {step.label}
                          </StepLabel>
                        </Step>
                      );
                    })}
                  </Stepper>
                </Box>
              </Box>
            )}

            {submitError && (
              <Alert severity="error" sx={{ mb: 4 }}>
                <AlertTitle>Registration Error</AlertTitle>
                {submitError}
              </Alert>
            )}

            {!isSuccess ? (
              <Box sx={{ minHeight: 280 }}>
                {renderStepContent(currentStep)}

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 6 }}>
                  <Button
                    disabled={currentStep === 0}
                    onClick={handlePrevious}
                    startIcon={<ArrowBackIcon />}
                    variant="text"
                    sx={{ textTransform: "none" }}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ px: 4, textTransform: "none" }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      color="success"
                      endIcon={<LaunchIcon />}
                      sx={{ px: 4, textTransform: "none", fontWeight: 600 }}
                    >
                      Launch Portal
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              renderSuccessContent()
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
