import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/system";
import { G8 } from "../theme.js";
import { api, setSession } from "../api/client";

// ── Keyframes ────────────────────────────────────────────────────────────────

// Card enters from below with a fade
const cardEnter = keyframes`
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

// Logo bounces in
const logoEnter = keyframes`
  0%   { opacity: 0; transform: scale(0.5) rotate(-10deg); }
  65%  { opacity: 1; transform: scale(1.12) rotate(3deg);  }
  100% { opacity: 1; transform: scale(1)   rotate(0deg);   }
`;

// Logo icon pulses subtly on idle
const logoPulse = keyframes`
  0%,100% { box-shadow: 0 4px 16px ${alpha(G8.orange, 0.45)}; }
  50%      { box-shadow: 0 4px 32px ${alpha(G8.orange, 0.75)}, 0 0 0 6px ${alpha(G8.orange, 0.1)}; }
`;

// Title text slides up
const titleEnter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// Each form row slides + fades in (staggered via delay)
const rowEnter = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// Spinning border on the card while loading
const borderSpin = keyframes`
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
`;

// Rotating scan line across the button
const scanLine = keyframes`
  0%   { left: "-100%"; }
  100% { left:  "200%"; }
`;

// Subtle glow pulse on the border
const glowPulse = keyframes`
  0%,100% { opacity: 0.6; }
  50%      { opacity: 1;   }
`;

export default function LoginView({ onLogin }) {
  const [email,    setEmail]    = useState("admin@inka.local");
  const [password, setPassword] = useState("Inka@123");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSuccess(true);
      // slight delay so the user sees the success state before unmount
      setTimeout(() => { setSession(data); onLogin(data); }, 420);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {/* ── Wrapper with animated gradient border ─────────────────────── */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          position: "relative",
          animation: `${cardEnter} 0.65s cubic-bezier(.22,1,.36,1) both`,
        }}
      >
        {/* Rotating gradient glow ring */}
        <Box
          sx={{
            position: "absolute",
            inset: -2,
            borderRadius: "17px",
            background: `linear-gradient(135deg, ${G8.orange}, ${alpha("#7c3aed", 0.8)}, ${alpha(G8.orange, 0.4)}, ${alpha("#0ea5e9", 0.6)}, ${G8.orange})`,
            backgroundSize: "300% 300%",
            animation: `${borderSpin} 5s ease infinite, ${glowPulse} 3s ease-in-out infinite`,
            zIndex: 0,
            filter: "blur(6px)",
            opacity: 0.65,
          }}
        />

        {/* Hard border ring (crisp, no blur) */}
        <Box
          sx={{
            position: "absolute",
            inset: -1,
            borderRadius: "16px",
            background: `linear-gradient(135deg, ${alpha(G8.orange, 0.5)} 0%, ${alpha("#7c3aed", 0.35)} 40%, ${alpha("#0ea5e9", 0.35)} 70%, ${alpha(G8.orange, 0.4)} 100%)`,
            zIndex: 0,
          }}
        />

        {/* ── Card body ──────────────────────────────────────────────── */}
        <Box
          sx={(theme) => ({
            position: "relative",
            zIndex: 1,
            bgcolor: alpha(
              theme.palette.mode === "dark" ? G8.black2 : G8.cream2,
              theme.palette.mode === "dark" ? 0.94 : 0.96,
            ),
            backdropFilter:       "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRadius: "15px",
            overflow: "hidden",
            // success flash
            transition: "box-shadow 350ms ease",
            boxShadow: success
              ? `0 0 0 2px ${G8.orange}, 0 24px 80px ${alpha(G8.orange, 0.25)}`
              : "0 24px 80px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3)",
          })}
        >

          {/* ── Header ────────────────────────────────────────────────── */}
          <Box
            sx={{
              px: 3.5, pt: 3.5, pb: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Animated logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                mb: 2.8,
                animation: `${logoEnter} 0.7s cubic-bezier(.22,1,.36,1) 0.15s both`,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${alpha(G8.orange, 0.85)} 0%, ${G8.orange} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: `${logoPulse} 3s ease-in-out 1s infinite`,
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1 }}>
                  I
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "1.3rem",
                  letterSpacing: "-0.02em",
                  color: "text.primary",
                }}
              >
                INKA
              </Typography>
            </Box>

            {/* Title — staggered slide-up */}
            <Box sx={{ animation: `${titleEnter} 0.55s cubic-bezier(.22,1,.36,1) 0.3s both` }}>
              <Typography
                sx={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "1.7rem",
                  fontWeight: 400,
                  mb: 0.5,
                  color: "text.primary",
                  lineHeight: 1.2,
                }}
              >
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your workspace
              </Typography>
            </Box>
          </Box>

          {/* ── Form ──────────────────────────────────────────────────── */}
          <Box sx={{ px: 3.5, py: 3 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  animation: `${rowEnter} 0.3s ease both`,
                }}
              >
                {error}
              </Alert>
            )}

            <Stack component="form" spacing={2.2} onSubmit={submit}>

              {/* Email field */}
              <Box sx={{ animation: `${rowEnter} 0.5s cubic-bezier(.22,1,.36,1) 0.4s both` }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", fontWeight: 500, mb: 0.7, color: "text.primary", fontSize: "0.8125rem" }}
                >
                  Email address
                </Typography>
                <TextField
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                />
              </Box>

              {/* Password field */}
              <Box sx={{ animation: `${rowEnter} 0.5s cubic-bezier(.22,1,.36,1) 0.52s both` }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", fontWeight: 500, mb: 0.7, color: "text.primary", fontSize: "0.8125rem" }}
                >
                  Password
                </Typography>
                <TextField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  size="small"
                  type="password"
                  autoComplete="current-password"
                />
              </Box>

              {/* Submit button */}
              <Box
                sx={{ animation: `${rowEnter} 0.5s cubic-bezier(.22,1,.36,1) 0.64s both`, position: "relative" }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || success}
                  sx={{
                    height: 42,
                    mt: 0.3,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 300ms cubic-bezier(.66,0,.34,1)",
                    ...(success && {
                      bgcolor: `${G8.orange} !important`,
                      boxShadow: `0 0 24px ${alpha(G8.orange, 0.5)} !important`,
                    }),
                    // scan-line shimmer on hover
                    "&:not(:disabled)::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "60%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      transition: "none",
                    },
                    "&:not(:disabled):hover::after": {
                      animation: `${scanLine} 0.55s cubic-bezier(.66,0,.34,1) forwards`,
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} thickness={4} sx={{ color: "#fff" }} />
                      <span>Signing in…</span>
                    </Box>
                  ) : success ? (
                    "✓ Signed in"
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </Box>

            </Stack>
          </Box>

          <Divider />
          <Box
            sx={{
              px: 3.5, py: 1.5,
              animation: `${rowEnter} 0.5s cubic-bezier(.22,1,.36,1) 0.75s both`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Role-based access control · Contact your admin for credentials
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
