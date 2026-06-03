"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Business as BusinessIcon,
  VerifiedUser as VerifyIcon,
  Login as LoginIcon,
  PersonAdd as JoinIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";

interface AuthCard {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  bgGradient: string;
  chipLabel: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  isPrimary?: boolean;
}

const authOptions: AuthCard[] = [
  {
    id: "register-cooperative",
    icon: BusinessIcon,
    iconColor: "#1A4F8B",
    bgGradient: "linear-gradient(135deg, #1A4F8B12 0%, #1FAF5A18 100%)",
    chipLabel: "For Organizations",
    title: "Register a Cooperative",
    description:
      "Onboard your credit union, thrift society, or cooperative onto the platform. Set up your white-labeled portal with a custom subdomain in minutes.",
    cta: "Launch Your Portal",
    href: "/auth/register-cooperative",
    isPrimary: true,
  },
  {
    id: "verify-account",
    icon: VerifyIcon,
    iconColor: "#1FAF5A",
    bgGradient: "linear-gradient(135deg, #1FAF5A12 0%, #C9A22718 100%)",
    chipLabel: "Existing Members",
    title: "Verify & Activate Account",
    description:
      "Already on our system? Select your cooperative, verify your biodata via phone, and activate your online account to start managing your finances.",
    cta: "Verify My Account",
    href: "/auth/verify",
  },
  {
    id: "login",
    icon: LoginIcon,
    iconColor: "#C9A227",
    bgGradient: "linear-gradient(135deg, #C9A22712 0%, #1A4F8B18 100%)",
    chipLabel: "Members",
    title: "Member Login",
    description:
      "Sign in to your cooperative portal to view savings, apply for loans, track repayments, and manage your financial profile.",
    cta: "Sign In",
    href: "/auth/login",
  },
  {
    id: "join-cooperative",
    icon: JoinIcon,
    iconColor: "#7B5EA7",
    bgGradient: "linear-gradient(135deg, #7B5EA712 0%, #1FAF5A18 100%)",
    chipLabel: "New Members",
    title: "Join a Cooperative",
    description:
      "Find and apply to join a cooperative that works for you. Select from the list of registered societies and submit your membership application.",
    cta: "Apply to Join",
    href: "/auth/register",
  },
];

export default function AuthHubPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 15% 20%, ${theme.palette.primary.main}18 0%, transparent 50%),
          radial-gradient(circle at 85% 80%, ${theme.palette.secondary.main}15 0%, transparent 50%),
          linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)
        `,
        display: "flex",
        flexDirection: "column",
        py: { xs: 5, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
          {/* Logo / Brand */}
          <Typography
            component={Link}
            href="/"
            variant="h4"
            fontWeight="800"
            sx={{
              display: "inline-block",
              mb: 4,
              textDecoration: "none",
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            FeasibilityFinance
          </Typography>

          <Typography
            variant="h3"
            component="h1"
            fontWeight="800"
            gutterBottom
            sx={{
              fontSize: { xs: "1.9rem", md: "2.7rem" },
              color: "text.primary",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Where would you like to{" "}
            <Box
              component="span"
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              go?
            </Box>
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 520, mx: "auto", fontWeight: 400, lineHeight: 1.6 }}
          >
            One platform for cooperatives, treasurers, and members. Choose your
            path below.
          </Typography>
        </Box>

        {/* Auth Cards Grid */}
        <Grid container spacing={3}>
          {authOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3, xl: 2 }} key={option.id}>
                <Card
                  component={Link}
                  href={option.href}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    textDecoration: "none",
                    border: option.isPrimary
                      ? `2px solid ${theme.palette.primary.main}40`
                      : "1.5px solid rgba(0,0,0,0.07)",
                    borderRadius: 4,
                    background: option.bgGradient,
                    backdropFilter: "blur(12px)",
                    boxShadow: option.isPrimary
                      ? `0 8px 32px ${theme.palette.primary.main}20`
                      : "0 4px 20px rgba(0,0,0,0.06)",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-6px) scale(1.015)",
                      boxShadow: `0 20px 50px ${option.iconColor}25`,
                      borderColor: `${option.iconColor}60`,
                    },
                    "&::before": option.isPrimary
                      ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        }
                      : {},
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3.5,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: `${option.iconColor}15`,
                        border: `1.5px solid ${option.iconColor}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                      }}
                    >
                      <Icon
                        sx={{ fontSize: 28, color: option.iconColor }}
                      />
                    </Box>

                    {/* Category chip */}
                    <Chip
                      label={option.chipLabel}
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        mb: 1.5,
                        bgcolor: `${option.iconColor}15`,
                        color: option.iconColor,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        letterSpacing: "0.5px",
                        border: `1px solid ${option.iconColor}30`,
                      }}
                    />

                    {/* Title */}
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      gutterBottom
                      sx={{ color: "text.primary", lineHeight: 1.3 }}
                    >
                      {option.title}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7, flexGrow: 1, mb: 3 }}
                    >
                      {option.description}
                    </Typography>

                    {/* CTA */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        sx={{ color: option.iconColor }}
                      >
                        {option.cta}
                      </Typography>
                      <ArrowForwardIcon
                        sx={{
                          fontSize: 16,
                          color: option.iconColor,
                          transition: "transform 0.2s ease",
                          ".MuiCard-root:hover &": {
                            transform: "translateX(4px)",
                          },
                        }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Footer note */}
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography variant="body2" color="text.disabled">
            &copy; {new Date().getFullYear()} FeasibilityFinance — Empowering
            Cooperative Societies.
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
            Need help?{" "}
            <Box
              component="a"
              href="mailto:support@feasibilityfinance.com"
              sx={{ color: theme.palette.primary.main, textDecoration: "none" }}
            >
              Contact Support
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
