import { useState } from "react";
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { api, setSession } from "../api/client";

export default function LoginView({ onLogin }) {
  const [email,    setEmail]    = useState("admin@inka.local");
  const [password, setPassword] = useState("Inka@123");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data);
      onLogin(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
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
        bgcolor: "background.default",
        p: 2,
      }}
    >
      {/* Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: "0 4px 24px rgba(10,37,64,0.10), 0 1px 4px rgba(10,37,64,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) => theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.02) : "#F6F9FC",
          }}
        >
          {/* Logo mark */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #7B73FF 0%, #635BFF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,91,255,0.3)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>I</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em", color: "text.primary" }}>
              INKA
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.4 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project Management System
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack component="form" spacing={1.8} onSubmit={submit}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.6, color: "text.primary" }}>
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

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  Password
                </Typography>
              </Stack>
              <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                size="small"
                type="password"
                autoComplete="current-password"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 0.5, height: 38, fontWeight: 600 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ px: 3, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Role-based access control enabled. Contact your admin for credentials.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
