"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeSlash, ArrowRight, EnvelopeSimple, ArrowLeft } from "@phosphor-icons/react";
import { authApi, setAuthToken } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/lib/languageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const { t, isVietnamese } = useLanguage();

  const [checkingSession, setCheckingSession] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("huy@example.com");
  const [password, setPassword] = useState("123456");
  const [confirmPassword, setConfirmPassword] = useState("123456");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // ─── TỰ ĐỘNG LƯU SESSION & CHUYỂN HƯỚNG NẾU ĐÃ ĐĂNG NHẬP ──────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Đã có phiên đăng nhập hợp lệ -> chuyển thẳng vào Dashboard
        window.location.replace("/dashboard");
      } else {
        setCheckingSession(false);
      }
    });
    return () => unsubscribe();
  }, []);

  function translateFirebaseError(err: any): string {
    const code = err?.code || "";
    if (isVietnamese) {
      if (code === "auth/invalid-email") return "Địa chỉ email không hợp lệ.";
      if (code === "auth/user-not-found") return "Không tìm thấy tài khoản với email này.";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential")
        return "Email hoặc mật khẩu không chính xác.";
      if (code === "auth/email-already-in-use")
        return "Email này đã được sử dụng. Vui lòng đăng nhập.";
      if (code === "auth/weak-password")
        return "Mật khẩu quá ngắn, vui lòng nhập tối thiểu 6 ký tự.";
      if (code === "auth/too-many-requests")
        return "Quá nhiều yêu cầu thử lại. Vui lòng đợi trong giây lát.";
      if (code === "auth/popup-closed-by-user")
        return "Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.";
      return err?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
    } else {
      if (code === "auth/invalid-email") return "Invalid email address.";
      if (code === "auth/user-not-found") return "No account found with this email.";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential")
        return "Incorrect email or password.";
      if (code === "auth/email-already-in-use")
        return "This email is already in use. Please log in.";
      if (code === "auth/weak-password")
        return "Password is too short (minimum 6 characters).";
      if (code === "auth/too-many-requests")
        return "Too many requests. Please try again later.";
      if (code === "auth/popup-closed-by-user")
        return "Google sign-in popup was closed.";
      return err?.message || "An error occurred. Please try again.";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (isRegister) {
      if (cleanPassword.length < 6) {
        setErrorMsg(isVietnamese ? "Mật khẩu cần tối thiểu 6 ký tự." : "Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setErrorMsg(isVietnamese ? "Mật khẩu xác nhận không khớp." : "Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      const data = isRegister
        ? await authApi.register(fullName.trim() || cleanEmail.split("@")[0], cleanEmail, cleanPassword)
        : await authApi.login(cleanEmail, cleanPassword);

      setAuthToken(data.token);
      localStorage.setItem(
        "weekloop_user",
        JSON.stringify({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
        })
      );
      window.location.replace("/dashboard");
      return;
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(translateFirebaseError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await authApi.loginWithGoogle();
      setAuthToken(data.token);
      localStorage.setItem(
        "weekloop_user",
        JSON.stringify({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
        })
      );
      window.location.replace("/dashboard");
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setErrorMsg(translateFirebaseError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setResetMsg(isVietnamese ? "Vui lòng nhập email." : "Please enter your email.");
      return;
    }

    setResetLoading(true);
    setResetMsg("");
    try {
      await authApi.sendPasswordResetEmail(targetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "var(--accent)",
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 520 }}>
          {t.verifyingSession}
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-alt)",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      {/* Nút chuyển đổi ngôn ngữ ở góc trên */}
      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 10,
        }}
      >
        <LanguageToggle size="sm" />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 410,
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Logo & Tiêu đề */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginBottom: "1.25rem",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: "var(--accent)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontWeight: 620,
                fontSize: "1.125rem",
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              WeekLoop
            </span>
          </Link>
          <h1
            style={{
              fontWeight: 580,
              fontSize: "1.5rem",
              letterSpacing: "-0.025em",
              color: "var(--text)",
              lineHeight: 1.15,
              marginBottom: "0.375rem",
            }}
          >
            {showForgotPassword
              ? t.forgotPasswordTitle
              : isRegister
              ? t.signUp
              : t.login}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {showForgotPassword
              ? t.resetPasswordInstruction
              : isRegister
              ? t.registerSub
              : t.loginSub}
          </p>
        </div>

        {/* Khung Quên mật khẩu */}
        {showForgotPassword ? (
          <div
            style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.125rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {resetSent ? (
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <EnvelopeSimple size={26} weight="duotone" />
                </div>
                <h3
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 620,
                    color: "var(--text)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {t.checkYourEmail}
                </h3>
                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "1.25rem",
                  }}
                >
                  {t.resetConfirmationDesc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setResetMsg("");
                    }}
                    className="btn-ghost"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.84rem",
                      padding: "0.5rem",
                    }}
                  >
                    {isVietnamese ? "Gửi lại email" : "Resend email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setErrorMsg("");
                    }}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      padding: "0.6rem",
                    }}
                  >
                    {t.backToLogin}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {resetMsg && (
                  <div
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius)",
                      background: "#FEF2F2",
                      border: "1px solid #F87171",
                      color: "#B91C1C",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {resetMsg}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label
                    htmlFor="reset-email"
                    style={{ fontSize: "0.8125rem", fontWeight: 520, color: "var(--text)" }}
                  >
                    {t.email}
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail || email}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="ban@example.com"
                    style={{
                      padding: "0.5625rem 0.75rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border-mid)",
                      fontSize: "0.9375rem",
                      color: "var(--text)",
                      background: "var(--bg)",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "0.9375rem",
                    padding: "0.625rem 1rem",
                    opacity: resetLoading ? 0.7 : 1,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {resetLoading ? t.loading : t.sendResetLink}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                  }}
                >
                  <ArrowLeft size={14} /> {t.backToLogin}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Khung biểu mẫu Đăng nhập / Đăng ký */
          <form
            id="login-form"
            onSubmit={handleSubmit}
            style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.125rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {errorMsg && (
              <div
                style={{
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius)",
                  background: "#FEF2F2",
                  border: "1px solid #F87171",
                  color: "#B91C1C",
                  fontSize: "0.8125rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Họ tên (chỉ khi đăng ký) */}
            {isRegister && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="register-name"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 520,
                    color: "var(--text)",
                  }}
                >
                  {t.fullName}
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isVietnamese ? "VD: Huy Nguyễn" : "e.g. Alex Johnson"}
                  style={{
                    padding: "0.5625rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-mid)",
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                    background: "var(--bg)",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label
                htmlFor="login-email"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 520,
                  color: "var(--text)",
                }}
              >
                {t.email}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ban@example.com"
                style={{
                  padding: "0.5625rem 0.75rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-mid)",
                  fontSize: "0.9375rem",
                  color: "var(--text)",
                  background: "var(--bg)",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  width: "100%",
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)")
                }
              />
            </div>

            {/* Mật khẩu */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 520,
                    color: "var(--text)",
                  }}
                >
                  {t.password}
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email);
                      setResetSent(false);
                      setResetMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "0.78125rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isVietnamese ? "Nhập mật khẩu (tối thiểu 6 ký tự)" : "Enter password (min 6 chars)"}
                  style={{
                    padding: "0.5625rem 2.25rem 0.5625rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border-mid)",
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                    background: "var(--bg)",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                    width: "100%",
                  }}
                  onFocus={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)")
                  }
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  style={{
                    position: "absolute",
                    right: "0.625rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu (chỉ khi Đăng ký) */}
            {isRegister && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="register-confirm-password"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 520,
                    color: "var(--text)",
                  }}
                >
                  {t.confirmPassword}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="register-confirm-password"
                    type={showConfirmPass ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={isVietnamese ? "Nhập lại mật khẩu" : "Re-enter password"}
                    style={{
                      padding: "0.5625rem 2.25rem 0.5625rem 0.75rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border-mid)",
                      fontSize: "0.9375rem",
                      color: "var(--text)",
                      background: "var(--bg)",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((v) => !v)}
                    aria-label={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    style={{
                      position: "absolute",
                      right: "0.625rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                  >
                    {showConfirmPass ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Nút gửi form */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                fontSize: "0.9375rem",
                padding: "0.625rem 1rem",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                marginTop: "0.25rem",
              }}
            >
              {loading
                ? t.loading
                : isRegister
                ? t.signUp
                : t.login}
              {!loading && <ArrowRight size={15} />}
            </button>

            {/* Dấu phân cách HOẶC */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontWeight: 500 }}>
                {t.orDivider}
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            </div>

            {/* Nút Đăng nhập Google */}
            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                padding: "0.625rem 1rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--card-bg, #fff)",
                color: "var(--text)",
                fontSize: "0.875rem",
                fontWeight: 540,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-alt)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--card-bg, #fff)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.27-2.09 3.67-5.17 3.67-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.24v3.12C3.26 21.36 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.61H1.24C.45 8.19 0 9.99 0 12s.45 3.81 1.24 5.39l4.03-3.12z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.61l4.03 3.12c.95-2.85 3.6-4.98 6.73-4.98z" />
              </svg>
              {t.continueWithGoogle}
            </button>
          </form>
        )}

        {/* Chuyển đổi Đăng nhập / Đăng ký */}
        {!showForgotPassword && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            {isRegister ? `${t.alreadyHaveAccount} ` : `${t.dontHaveAccount} `}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg("");
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--accent)",
                cursor: "pointer",
                fontWeight: 580,
                fontSize: "0.875rem",
              }}
            >
              {isRegister ? t.login : t.signUp}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
