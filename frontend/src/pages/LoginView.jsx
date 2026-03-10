import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { api, setSession } from "../api/client";

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState("admin@inka.local");
  const [password, setPassword] = useState("Inka@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 440 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LockOutlinedIcon color="primary" />
          <Typography variant="h6">INKA Login</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Role-based authorization enabled.
        </Typography>

        {error ? <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert> : null}

        <Stack component="form" spacing={1.2} onSubmit={submit}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Button type="submit" variant="contained" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
