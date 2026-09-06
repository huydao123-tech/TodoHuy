"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeSlash, ArrowRight } from "@phosphor-icons/react";
import { authApi, setAuthToken } from "@/lib/api";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("huy@example.com");
  const [password, setPassword] = useState("123456");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const data = isRegister
        ? await authApi.register(fullName.trim(), cleanEmail, cleanPassword)
        : await authApi.login(cleanEmail, cleanPassword);
      setAuthToken(data.token);
      localStorage.setItem("weekloop_user", JSON.stringify({
        id: data.id,
        fullName: data.fullName,
        email: data.email,
      }));
      window.location.href = "/dashboard";
      return;
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
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
              marginBottom: "1.5rem",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: "var(--accent)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontWeight: 620,
                fontSize: "1.0625rem",
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
            {isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            {isRegister
              ? "Tạo không gian lên kế hoạch tuần cá nhân."
              : "Tiếp tục quản lý mục tiêu và công việc của bạn."}
          </p>
        </div>

        {/* Khung biểu mẫu (Form Card) */}
        <form
          id="login-form"
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
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
                Họ và tên
              </label>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="VD: Nguyễn Văn Huy"
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
              Địa chỉ Email
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
                Mật khẩu
              </label>
              {!isRegister && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--accent)",
                    cursor: "pointer",
                  }}
                  onClick={() => alert("Vui lòng đăng nhập với tài khoản mặc định: huy@example.com / 123456")}
                >
                  Quên mật khẩu?
                </span>
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
                placeholder="Nhập mật khẩu của bạn"
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
              ? "Đang xử lý..."
              : isRegister
              ? "Tạo tài khoản"
              : "Đăng nhập"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Chuyển đổi Đăng nhập / Đăng ký */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
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
            {isRegister ? "Đăng nhập ngay" : "Đăng ký miễn phí"}
          </button>
        </p>
      </div>
    </main>
  );
}
