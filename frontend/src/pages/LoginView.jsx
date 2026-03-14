import { useState } from "react";
import { Button, Divider, Input } from "@heroui/react";
import { api, setSession } from "../api/client";

export default function LoginView({ onLogin, isDark, onToggleTheme }) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0D1B2E] p-4">
      {/* Theme toggle (top right) */}
      <button
        onClick={onToggleTheme}
        className="fixed top-4 right-4 w-8 h-8 rounded-md flex items-center justify-center text-[#697386] hover:bg-[#E3E8EF] dark:hover:bg-[#162B47] transition-colors"
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd"/>
          </svg>
        )}
      </button>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-white dark:bg-[#0F2240] border border-[#E3E8EF] dark:border-[#1E3A5F] rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#E3E8EF] dark:border-[#1E3A5F] bg-[#F6F9FC] dark:bg-[#0D1B2E]/40">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#7B73FF] to-[#635BFF] flex items-center justify-center shadow-[0_4px_12px_rgba(99,91,255,0.3)]">
              <span className="text-white font-bold text-[15px] leading-none">I</span>
            </div>
            <span className="font-bold text-[1.1rem] tracking-tight text-[#0A2540] dark:text-[#C9D7E8]">
              INKA
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0A2540] dark:text-[#C9D7E8] mb-1">Sign in</h1>
          <p className="text-sm text-[#697386] dark:text-[#7B93AE]">Project Management System</p>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-[#FFF1F3] dark:bg-[#DF1B41]/10 border border-[#DF1B41]/20 rounded-lg text-[#DF1B41] text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="inka-label">Email address</label>
              <Input
                value={email}
                onValueChange={setEmail}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                variant="bordered"
                size="sm"
                classNames={{
                  inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] data-[focus=true]:border-[#635BFF] data-[focus=true]:ring-2 data-[focus=true]:ring-[#635BFF]/15 rounded-md",
                  input: "text-sm text-[#1A1F36] dark:text-[#C9D7E8] placeholder:text-[#697386]",
                }}
              />
            </div>

            <div>
              <label className="inka-label">Password</label>
              <Input
                value={password}
                onValueChange={setPassword}
                type="password"
                autoComplete="current-password"
                variant="bordered"
                size="sm"
                classNames={{
                  inputWrapper: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] data-[focus=true]:border-[#635BFF] data-[focus=true]:ring-2 data-[focus=true]:ring-[#635BFF]/15 rounded-md",
                  input: "text-sm text-[#1A1F36] dark:text-[#C9D7E8]",
                }}
              />
            </div>

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              fullWidth
              className="h-[38px] font-semibold mt-1 bg-gradient-to-b from-[#7B73FF] to-[#635BFF] hover:from-[#635BFF] hover:to-[#4F46E5] shadow-none"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <Divider className="bg-[#E3E8EF] dark:bg-[#1E3A5F]" />
        <div className="px-6 py-3">
          <p className="text-xs text-[#697386] dark:text-[#7B93AE]">
            Role-based access control enabled. Contact your admin for credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
