import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/system";
import { G8 } from "../theme.js";
import { api, setSession } from "../api/client";

// ── Keyframes ─────────────────────────────────────────────────────────────────

const cardReveal = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

const logoReveal = keyframes`
  0%   { opacity: 0; transform: scale(0.5)  rotate(-16deg); }
  60%  { opacity: 1; transform: scale(1.15) rotate(5deg);   }
  100% { opacity: 1; transform: scale(1)    rotate(0deg);   }
`;

// Yellow neon pulse on logo — CSB signature
const logoNeon = keyframes`
  0%,100% {
    box-shadow:
      0 0  8px ${alpha(G8.orange, 0.65)},
      0 0 18px ${alpha(G8.orange, 0.25)};
  }
  50% {
    box-shadow:
      0 0 14px ${alpha(G8.orange, 0.85)},
      0 0 32px ${alpha(G8.orange, 0.4)},
      0 0 60px ${alpha(G8.orange, 0.15)};
  }
`;

const rowReveal = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// Yellow border sweep
const borderSweep = keyframes`
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
`;

// Loading shimmer on button
const btnShimmer = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
`;

// Success ring pulse — yellow
const successRing = keyframes`
  0%   { box-shadow: 0 0 0 0    ${alpha(G8.orange, 0.6)}, 0 8px 40px ${alpha(G8.orange, 0.3)}; }
  60%  { box-shadow: 0 0 0 14px ${alpha(G8.orange, 0)},   0 8px 40px ${alpha(G8.orange, 0.5)}; }
  100% { box-shadow: 0 0 0 0    ${alpha(G8.orange, 0)},   0 8px 40px ${alpha(G8.orange, 0.2)}; }
`;

// Outer glow breathe
const glowBreathe = keyframes`
  0%,100% { opacity: 0.45; }
  50%      { opacity: 0.8; }
`;

// Scan line sweeps down once on mount
const scanDown = keyframes`
  0%   { top: -3px; opacity: 0.8; }
  70%  { opacity: 0.4; }
  100% { top: 100%;  opacity: 0; }
`;

// Background blobs
const floatA = keyframes`
  0%,100% { transform: translate(0px,   0px)   scale(1);    }
  33%      { transform: translate(50px,  70px)  scale(1.06); }
  66%      { transform: translate(-35px, 45px)  scale(0.95); }
`;
const floatB = keyframes`
  0%,100% { transform: translate(0px,    0px)   scale(1);    }
  40%      { transform: translate(-65px, -45px)  scale(0.94); }
  75%      { transform: translate(55px,   65px)  scale(1.05); }
`;

// ── Component ─────────────────────────────────────────────────────────────────

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
      setTimeout(() => { setSession(data); onLogin(data); }, 540);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 2,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── Ambient blobs (yellow + ash) ────────────────────────────── */}
      <Box aria-hidden="true" sx={{
        position: "absolute", inset: 0,
        pointerEvents: "none", overflow: "hidden",
      }}>
        <Box sx={{
          position: "absolute",
          width: 500, height: 500,
          top: "-18%", right: "-8%",
          borderRadius: "50%",
          background: (t) => t.palette.mode === "dark"
            ? `radial-gradient(circle, ${alpha(G8.orange, 0.1)} 0%, transparent 65%)`
            : `radial-gradient(circle, ${alpha(G8.orangeDim, 0.07)} 0%, transparent 65%)`,
          animation: `${floatA} 24s ease-in-out infinite`,
          filter: "blur(3px)",
        }} />
        <Box sx={{
          position: "absolute",
          width: 420, height: 420,
          bottom: "-14%", left: "-8%",
          borderRadius: "50%",
          background: (t) => t.palette.mode === "dark"
            ? `radial-gradient(circle, ${alpha("#808080", 0.07)} 0%, transparent 65%)`
            : `radial-gradient(circle, ${alpha("#808080", 0.05)} 0%, transparent 65%)`,
          animation: `${floatB} 30s ease-in-out infinite`,
          filter: "blur(3px)",
        }} />
      </Box>

      {/* ── Card wrapper ─────────────────────────────────────────────── */}
      <Box sx={{
        width: "100%",
        maxWidth: 400,
        position: "relative",
        animation: `${cardReveal} 0.55s cubic-bezier(0.16, 1, 0.3, 1) both`,
      }}>
        {/* Outer glow — yellow blur ring */}
        <Box aria-hidden="true" sx={{
          position: "absolute",
          inset: -10,
          borderRadius: "22px",
          background: `linear-gradient(135deg, ${alpha(G8.orange, 0.4)}, ${alpha(G8.orangeDim, 0.25)}, ${alpha(G8.orange, 0.35)})`,
          backgroundSize: "300% 300%",
          animation: `${borderSweep} 5s ease infinite, ${glowBreathe} 3s ease-in-out infinite`,
          filter: "blur(14px)",
          zIndex: 0,
          opacity: success ? 1 : 0.55,
          transition: "opacity 400ms ease",
        }} />

        {/* Crisp border ring — yellow gradient */}
        <Box aria-hidden="true" sx={{
          position: "absolute",
          inset: -1.5,
          borderRadius: "13.5px",
          background: success
            ? `linear-gradient(135deg, ${G8.orange}, ${G8.orangeDim})`
            : `linear-gradient(135deg, ${alpha(G8.orange, 0.7)}, ${alpha("#808080", 0.4)}, ${alpha(G8.orange, 0.65)})`,
          backgroundSize: "300% 300%",
          animation: `${borderSweep} 5s ease infinite`,
          zIndex: 0,
        }} />

        {/* Card body */}
        <Box sx={(theme) => ({
          position: "relative",
          zIndex: 1,
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: theme.palette.mode === "dark"
            ? alpha(G8.black2, 0.96)
            : alpha(G8.cream, 0.97),
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: success
            ? `0 0 0 2px ${G8.orange}, 0 12px 48px ${alpha(G8.orange, 0.35)}, 0 32px 100px ${alpha(G8.orange, 0.18)}, inset 0 1px 0 ${alpha("#fff", 0.06)}`
            : theme.palette.mode === "dark"
              ? `0 2px 4px rgba(0,0,0,0.95), 0 8px 32px rgba(0,0,0,0.82), 0 24px 80px rgba(0,0,0,0.65), 0 60px 120px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`
              : `0 2px 4px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.08), 0 24px 80px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)`,
          transition: "box-shadow 450ms cubic-bezier(0.16, 1, 0.3, 1)",
          animation: success ? `${successRing} 0.65s ease` : undefined,
        })}>

          {/* Scan line — once on mount */}
          <Box aria-hidden="true" sx={{
            position: "absolute",
            left: 0, right: 0, height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${alpha(G8.orange, 0.8)} 40%, ${alpha(G8.orange, 0.5)} 60%, transparent 100%)`,
            animation: `${scanDown} 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both`,
            zIndex: 2, pointerEvents: "none",
          }} />

          {/* ── Header ────────────────────────────────────────────── */}
          <Box sx={{ px: 3.5, pt: 3.5, pb: 2.8, borderBottom: "1px solid", borderColor: "divider" }}>

            {/* Logo row */}
            <Box sx={{
              display: "flex", alignItems: "center", gap: 1.2, mb: 2.8,
              animation: `${logoReveal} 0.65s cubic-bezier(0.16,1,0.3,1) 0.15s both`,
            }}>
              {/* Yellow square logo — CSB style */}
              <Box sx={{
                width: 30, height: 30,
                borderRadius: "7px",
                backgroundColor: G8.orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                animation: `${logoNeon} 3s ease-in-out 1.5s infinite`,
              }}>
                <Typography sx={{
                  color: "#151515",    // dark text on yellow — CSB signature
                  fontWeight: 800,
                  fontSize: 14,
                  lineHeight: 1,
                  fontFamily: '"Inter", sans-serif',
                }}>I</Typography>
              </Box>

              {/* INKA text — yellow on dark */}
              <Typography sx={{
                fontWeight: 700,
                fontSize: "1.05rem",
                letterSpacing: "-0.03em",
                color: (t) => t.palette.mode === "dark" ? G8.orange : G8.orangeDim,
              }}>
                INKA
              </Typography>
            </Box>

            {/* Title + subtitle */}
            <Box sx={{ animation: `${rowReveal} 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both` }}>
              <Typography sx={{
                fontWeight: 700,
                fontSize: "1.4rem",
                letterSpacing: "-0.035em",
                lineHeight: 1.2,
                mb: 0.5,
                color: "text.primary",
              }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue to your workspace
              </Typography>
            </Box>
          </Box>

          {/* ── Form ──────────────────────────────────────────────── */}
          <Box sx={{ px: 3.5, py: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, animation: `${rowReveal} 0.3s ease both` }}>
                {error}
              </Alert>
            )}

            <Stack component="form" spacing={2.2} onSubmit={submit}>

              {/* Email */}
              <Box sx={{ animation: `${rowReveal} 0.5s cubic-bezier(0.16,1,0.3,1) 0.42s both` }}>
                <Typography variant="caption" sx={{
                  display: "block", fontWeight: 600, mb: 0.6,
                  color: "text.secondary", fontSize: "0.8rem", letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}>
                  Email address
                </Typography>
                <TextField
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth size="small"
                  type="email" placeholder="you@company.com"
                  autoComplete="email" autoFocus
                />
              </Box>

              {/* Password */}
              <Box sx={{ animation: `${rowReveal} 0.5s cubic-bezier(0.16,1,0.3,1) 0.54s both` }}>
                <Typography variant="caption" sx={{
                  display: "block", fontWeight: 600, mb: 0.6,
                  color: "text.secondary", fontSize: "0.8rem", letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}>
                  Password
                </Typography>
                <TextField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth size="small"
                  type="password" autoComplete="current-password"
                />
              </Box>

              {/* Submit — yellow with dark text (CSB primary button style) */}
              <Box sx={{ animation: `${rowReveal} 0.5s cubic-bezier(0.16,1,0.3,1) 0.66s both`, pt: 0.3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || success}
                  sx={{
                    height: 40,
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: "#151515 !important",
                    position: "relative",
                    overflow: "hidden",
                    ...(loading && {
                      background: `linear-gradient(90deg, ${G8.orange} 0%, ${G8.orangeLight} 50%, ${G8.orange} 100%)`,
                      backgroundSize: "300% auto",
                      animation: `${btnShimmer} 1.4s linear infinite`,
                    }),
                    ...(success && {
                      backgroundColor: `${G8.orange} !important`,
                    }),
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={14} thickness={4} sx={{ color: "#151515" }} />
                      <span>Signing in…</span>
                    </Box>
                  ) : success ? "✓  Signed in" : "Sign in →"}
                </Button>
              </Box>

            </Stack>
          </Box>

          <Divider />
          <Box sx={{
            px: 3.5, py: 1.5,
            animation: `${rowReveal} 0.5s cubic-bezier(0.16,1,0.3,1) 0.78s both`,
          }}>
            <Typography sx={{
              fontSize: "0.72rem",
              color: "text.secondary",
              fontFamily: '"Menlo","Monaco","Cascadia Code","Courier New",monospace',
            }}>
              // role-based access · contact admin for credentials
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
