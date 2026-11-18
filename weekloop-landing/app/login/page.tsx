"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeSlash, ArrowRight, EnvelopeSimple, ArrowLeft, Check } from "@phosphor-icons/react";
import { authApi, setAuthToken } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/lib/languageContext";
import LanguageToggle from "@/components/LanguageToggle";

function afterLoginPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/dashboard";
  return raw;
}

/** Đọc mã lỗi/message từ lỗi Firebase mà không dùng `any`. */
function readAuthError(err: unknown): { code: string; message: string } {
  if (typeof err !== "object" || err === null) return { code: "", message: "" };
  const { code, message } = err as { code?: unknown; message?: unknown };
  return {
    code: typeof code === "string" ? code : "",
    message: typeof message === "string" ? message : "",
  };
}

export default function LoginPage() {
  const { t, isVietnamese } = useLanguage();

  const [checkingSession, setCheckingSession] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        window.location.replace(afterLoginPath());
      } else {
        setCheckingSession(false);
      }
    });
    return () => unsubscribe();
  }, []);

  function translateFirebaseError(err: unknown): string {
    const { code, message } = readAuthError(err);
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
      return message || "Đã xảy ra lỗi. Vui lòng thử lại.";
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
      return message || "An error occurred. Please try again.";
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
      window.location.replace(afterLoginPath());
      return;
    } catch (error: unknown) {
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
      window.location.replace(afterLoginPath());
    } catch (error: unknown) {
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
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="login-root auth-root auth-loading">
        <style>{`
          .auth-loading {
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 24px;
            background: var(--bg);
          }
          .auth-loading-mark {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(135deg, #16A34A 0%, #0D9488 100%);
            box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
            animation: auth-pulse 1.4s infinite ease-in-out;
          }
          .auth-loading-text {
            margin: 0;
            font-size: 13.5px;
            font-weight: 500;
            line-height: 1.4;
            color: var(--text-muted);
          }
          @keyframes auth-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.94); }
          }
          @media (prefers-reduced-motion: reduce) {
            .auth-loading-mark { animation: none; }
          }
        `}</style>
        <div className="auth-loading-mark" aria-hidden />
        <p className="auth-loading-text">{t.verifyingSession}</p>
      </main>
    );
  }

  const tagline = isRegister ? t.registerSub : t.loginSub;

  return (
    <main className="login-root auth-root">
      {/* Language pill ở góc trên phải */}
      <div className="auth-lang">
        <LanguageToggle size="sm" />
      </div>

      <div className="auth-wrap">
        {/* ─── Brand: logo gradient + app name + tagline ───────────────────── */}
        <header className="auth-brand">
          <Link href="/" className="auth-logo" aria-label="WeekLoop">
            <Check size={38} weight="bold" color="#fff" aria-hidden />
          </Link>
          <h1 className="auth-app-name">WeekLoop</h1>
          {!showForgotPassword && <p className="auth-tagline">{tagline}</p>}
        </header>

        {showForgotPassword ? (
          /* ─── Quên mật khẩu ───────────────────────────────────────────── */
          <section className="auth-panel" aria-live="polite">
            {resetSent ? (
              <>
                <div className="auth-lead">
                  <span className="auth-lead-icon is-done" aria-hidden>
                    <Check size={28} weight="bold" color="#fff" />
                  </span>
                  <h2 className="auth-lead-title">{t.checkYourEmail}</h2>
                  <p className="auth-lead-desc">{t.resetConfirmationDesc}</p>
                </div>
                <div className="auth-stack">
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setResetMsg("");
                    }}
                    className="btn-ghost auth-ghost-btn"
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
                    className="btn-primary auth-submit"
                  >
                    {t.backToLogin}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="auth-lead">
                  <span className="auth-lead-icon" aria-hidden>
                    <EnvelopeSimple size={26} weight="duotone" />
                  </span>
                  <h2 className="auth-lead-title">{t.forgotPasswordTitle}</h2>
                  <p className="auth-lead-desc">{t.resetPasswordInstruction}</p>
                </div>

                <form onSubmit={handleSendResetPassword} className="auth-panel">
                  {resetMsg && (
                    <div className="auth-error" role="alert">
                      {resetMsg}
                    </div>
                  )}

                  <div className="auth-field">
                    <label htmlFor="reset-email" className="auth-label">
                      {t.email}
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      className="auth-input"
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="ban@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn-primary auth-submit"
                  >
                    {resetLoading ? t.loading : t.sendResetLink}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="auth-back-link"
                  >
                    <ArrowLeft size={14} aria-hidden /> {t.backToLogin}
                  </button>
                </form>
              </>
            )}
          </section>
        ) : (
          /* ─── Đăng nhập / Đăng ký ─────────────────────────────────────── */
          <form id="login-form" onSubmit={handleSubmit} className="auth-form">
            {/* Segmented Login / Signup */}
            <div className="auth-seg" role="group" aria-label={isVietnamese ? "Chế độ tài khoản" : "Account mode"}>
              <button
                type="button"
                className={`auth-seg-btn${!isRegister ? " is-active" : ""}`}
                aria-pressed={!isRegister}
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg("");
                }}
              >
                {t.login}
              </button>
              <button
                type="button"
                className={`auth-seg-btn${isRegister ? " is-active" : ""}`}
                aria-pressed={isRegister}
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg("");
                }}
              >
                {t.signUp}
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error" role="alert">
                {errorMsg}
              </div>
            )}

            {/* Họ tên (chỉ khi đăng ký) */}
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="register-name" className="auth-label">
                  {t.fullName}
                </label>
                <input
                  id="register-name"
                  type="text"
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isVietnamese ? "VD: Huy Nguyễn" : "e.g. Alex Johnson"}
                />
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                {t.email}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ban@example.com"
              />
            </div>

            {/* Mật khẩu */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">
                  {t.password}
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email);
                      setResetSent(false);
                      setResetMsg("");
                    }}
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <div className="auth-pass-wrap">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className="auth-input auth-input-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isVietnamese ? "Nhập mật khẩu (tối thiểu 6 ký tự)" : "Enter password (min 6 chars)"}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="auth-pass-toggle"
                >
                  {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu (chỉ khi Đăng ký) */}
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="register-confirm-password" className="auth-label">
                  {t.confirmPassword}
                </label>
                <div className="auth-pass-wrap">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPass ? "text" : "password"}
                    autoComplete="new-password"
                    className="auth-input auth-input-pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={isVietnamese ? "Nhập lại mật khẩu" : "Re-enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((v) => !v)}
                    aria-label={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="auth-pass-toggle"
                  >
                    {showConfirmPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Nút gửi form */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary auth-submit"
            >
              {loading ? t.loading : isRegister ? t.signUp : t.login}
              {!loading && <ArrowRight size={17} weight="bold" aria-hidden />}
            </button>

            {/* Dấu phân cách HOẶC */}
            <div className="auth-divider" aria-hidden>
              <span className="auth-divider-line" />
              <span className="auth-divider-text">{t.orDivider}</span>
              <span className="auth-divider-line" />
            </div>

            {/* Nút Đăng nhập Google */}
            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="auth-google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
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
          <p className="auth-switch-text">
            {isRegister ? `${t.alreadyHaveAccount} ` : `${t.dontHaveAccount} `}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg("");
              }}
            >
              {isRegister ? t.login : t.signUp}
            </button>
          </p>
        )}
      </div>

      {/* Scoped styles — skin theo UI-DESIGN-REPORT.md §9 */}
      <style>{`
        .auth-root {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--bg);
          padding: 24px;
          font-family: var(--font-inter), var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
        }

        .auth-lang {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 10;
        }

        /* Active item của language pill dùng màu surface (dark mode đọc được) */
        .auth-root .language-pill-toggle button[aria-pressed="true"] {
          background: var(--card-bg) !important;
          color: var(--text) !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        [data-theme="dark"] .auth-root .language-pill-toggle button[aria-pressed="true"] {
          background: var(--surface-subtle) !important;
        }

        .auth-root button:focus-visible,
        .auth-root a:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .auth-wrap {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 8px 0;
        }

        /* ── Brand ── */
        .auth-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
        }

        .auth-logo {
          width: 68px;
          height: 68px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: linear-gradient(135deg, #16A34A 0%, #0D9488 100%);
          box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
          text-decoration: none;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .auth-logo:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
        }

        .auth-app-name {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.8px;
          color: var(--text);
        }

        .auth-tagline {
          margin: 0;
          max-width: 360px;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* ── Form ── */
        .auth-form,
        .auth-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Segmented Login / Signup */
        .auth-seg {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 14px;
        }

        .auth-seg-btn {
          flex: 1;
          height: 40px;
          padding: 0 12px;
          border: none;
          border-radius: 10px;
          background: transparent;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.2;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        }

        .auth-seg-btn:hover {
          color: var(--text);
        }

        .auth-seg-btn.is-active {
          background: var(--card-bg);
          color: var(--accent-contrast);
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] .auth-seg-btn.is-active {
          background: var(--surface-subtle);
        }

        /* Fields */
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-label-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .auth-label {
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text);
        }

        .auth-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          background: var(--input-bg);
          font-family: inherit;
          font-size: 15px;
          font-weight: 400;
          line-height: 1.4;
          color: var(--text);
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .auth-input::placeholder {
          color: var(--text-faint);
          font-size: 13.5px;
        }

        .auth-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .auth-input-pass {
          padding-right: 48px;
        }

        .auth-pass-wrap {
          position: relative;
        }

        .auth-pass-toggle {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .auth-pass-toggle:hover {
          color: var(--text);
          background: var(--bg-alt);
        }

        .auth-link {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--accent-contrast);
          cursor: pointer;
        }

        .auth-link:hover {
          text-decoration: underline;
        }

        .auth-error {
          padding: 10px 12px;
          border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent);
          border-radius: 12px;
          background: var(--danger-bg);
          color: var(--danger);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.45;
        }

        /* Nút chính */
        .auth-submit {
          width: 100%;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.2;
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Ưu tiên weight 700 của nút chính so với skin dùng chung */
        .auth-root .auth-submit {
          font-weight: 700;
        }

        .auth-ghost-btn {
          width: 100%;
          height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 2px 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .auth-divider-text {
          font-size: 12px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.04em;
          color: var(--text-faint);
        }

        /* Google */
        .auth-google {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--card-bg);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.2;
          color: var(--text);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .auth-google:hover:not(:disabled) {
          background: var(--bg-alt);
          border-color: var(--border-mid);
        }

        .auth-google:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Switch text */
        .auth-switch-text {
          margin: 0;
          text-align: center;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5;
          color: var(--text-muted);
        }

        .auth-switch-link {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-contrast);
          cursor: pointer;
        }

        .auth-switch-link:hover {
          text-decoration: underline;
        }

        /* ── Forgot password ── */
        .auth-lead {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 4px 0 2px;
        }

        .auth-lead-icon {
          width: 56px;
          height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--accent-ghost);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          color: var(--accent);
          margin-bottom: 4px;
        }

        .auth-lead-icon.is-done {
          background: var(--accent);
          color: #fff;
        }

        .auth-lead-title {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.4px;
          color: var(--text);
        }

        .auth-lead-desc {
          margin: 0;
          max-width: 360px;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          color: var(--text-muted);
        }

        .auth-back-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          align-self: center;
          padding: 6px;
          border: none;
          background: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .auth-back-link:hover {
          color: var(--text);
        }

        @media (min-width: 640px) {
          .auth-root {
            padding: 32px;
          }
        }

        @media (max-width: 639px) {
          .auth-root {
            padding: 20px 16px;
            align-items: flex-start;
          }

          .auth-wrap {
            gap: 20px;
            padding-top: 28px;
          }

          .auth-lang {
            top: 14px;
            right: 14px;
          }

          .auth-logo {
            width: 60px;
            height: 60px;
            border-radius: 18px;
          }

          .auth-app-name {
            font-size: 26px;
          }

          .auth-input,
          .auth-pass-toggle {
            font-size: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-logo,
          .auth-seg-btn,
          .auth-input,
          .auth-google,
          .auth-pass-toggle {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
