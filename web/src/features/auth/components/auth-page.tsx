"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, Eye, EyeOff, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AuthFormValues, AuthMode, ForgotPasswordValues } from "@/type";
import { useLogin, useRegister } from "@/features/auth";
import { getAuthErrorMessage } from "@/services/auth.service";

export function AuthPage() {
  const { locale, setLocale, t } = useI18n();
  const { login } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { registerUser, isLoading: isRegisterLoading } = useRegister();
  const { loginUser, isLoading: isLoginLoading } = useLogin();

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"input" | "sent">("input");

  // React Hook Form for Auth
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
    },
  });

  // React Hook Form for Forgot Password
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    setValue: setForgotValue,
    reset: resetForgot,
  } = useForm<ForgotPasswordValues>({
    defaultValues: {
      forgotEmail: "",
    },
  });

  const isLoading =
    isSubmitting || isActionLoading || isRegisterLoading || isLoginLoading;

  const onForgotSubmit = (data: ForgotPasswordValues) => {
    if (!data.forgotEmail?.trim()) return;
    setSentEmail(data.forgotEmail);
    setForgotStep("sent");
  };

  const onSubmit = async (data: AuthFormValues) => {
    if (!data.email || !data.password) {
      setError(
        locale === "vi"
          ? "Vui lòng nhập đầy đủ email và mật khẩu."
          : "Please enter your email and password.",
      );
      return;
    }

    if (mode === "signup") {
      if (!data.fullName?.trim()) {
        setError(
          locale === "vi"
            ? "Vui lòng nhập họ và tên."
            : "Please enter your full name.",
        );
        return;
      }

      const phoneTrimmed = data.phone?.trim() ?? "";
      if (!phoneTrimmed) {
        setError(
          locale === "vi"
            ? "Vui lòng nhập số điện thoại."
            : "Please enter your phone number.",
        );
        return;
      }

      if (!/^[0-9]{10}$/.test(phoneTrimmed)) {
        setError(
          locale === "vi"
            ? "Số điện thoại phải bao gồm đúng 10 chữ số."
            : "Phone number must be exactly 10 digits.",
        );
        return;
      }

      if (data.password.length < 8) {
        setError(t.passwordLengthHint);
        return;
      }

      setError(null);
      setSuccessMessage(null);

      try {
        await registerUser({
          name: data.fullName.trim(),
          email: data.email.trim(),
          password: data.password,
          phone: phoneTrimmed,
        });

        setSuccessMessage(
          locale === "vi"
            ? "Đăng ký tài khoản thành công! Đang chuyển sang đăng nhập..."
            : "Account created successfully! Switching to sign in...",
        );

        setTimeout(() => {
          setMode("signin");
          setSuccessMessage(null);
        }, 1500);
      } catch (err: unknown) {
        const rawError = getAuthErrorMessage(err);
        if (rawError.includes("user already exists")) {
          setError(
            locale === "vi"
              ? "Tài khoản (email hoặc số điện thoại) đã tồn tại."
              : "An account with this email or phone number already exists.",
          );
        } else {
          setError(rawError);
        }
      }
      return;
    }

    setError(null);

    try {
      await loginUser({
        login: data.email.trim(),
        password: data.password,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : getAuthErrorMessage(err);
      setError(errMessage);
    }
  };

  const [sentEmail, setSentEmail] = useState("");

  const handleDemoLogin = async () => {
    setIsActionLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await login("khang.tuan@wetalk.io", "Tuấn Khang");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await login("google.user@wetalk.io", "Google User");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#fafafa] dark:bg-[#0f111a] text-foreground select-text overflow-y-auto">
      {/* Top Bar: Language & Theme Switcher */}
      <div className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/">
          <AppLogo size={44} showText priority />
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme switch dropdown */}
          <ThemeToggle variant="dropdown" />

          {/* Language switch button */}
          <button
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-primary hover:border-primary/40 transition-all shadow-2xs"
            title={t.switchLanguage}
          >
            <span className="text-sm">{locale === "vi" ? "🇻🇳" : "🇦🇺"}</span>
            <span className="uppercase text-[11px] font-bold text-primary">
              {locale}
            </span>
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <AppLogo size={100} className="mb-4 shadow-md" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "signin" ? t.signInTitle : t.signUpTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
              {mode === "signin"
                ? locale === "vi"
                  ? "Nhập thông tin xác thực để truy cập không gian trò chuyện của bạn."
                  : "Enter your credentials to access your team workspace."
                : locale === "vi"
                  ? "Bắt đầu kết nối và cộng tác cùng đội nhóm với WeTalk."
                  : "Start collaborating seamlessly with your team on WeTalk."}
            </p>
          </div>

          {/* Form */}
          <div className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-xs p-7 sm:p-8">
            {/* Quick Demo Login Pill */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-linear-to-r from-primary-soft to-indigo-50 dark:from-primary/20 dark:to-indigo-950/40 border border-primary/20 text-primary text-xs font-semibold hover:border-primary/40 active:scale-98 transition-all group"
              >
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>{t.demoLogin}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Success banner */}
            {successMessage && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
              {/* Full Name (Sign Up only) */}
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                  <label
                    htmlFor="fullName"
                    className="text-xs font-medium text-foreground"
                  >
                    {t.fullName}
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    {...register("fullName")}
                    className="h-12 w-full px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-sm text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                </div>
              )}

              {/* Phone Number (Sign Up only) */}
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                  <label
                    htmlFor="phone"
                    className="text-xs font-medium text-foreground"
                  >
                    {t.phoneNumber}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    placeholder={
                      locale === "vi"
                        ? "Nhập số điện thoại (10 số, VD: 0912345678)"
                        : "Enter phone number (10 digits)"
                    }
                    {...register("phone")}
                    className="h-12 w-full px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-sm text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}

              {/* Email / Login Identifier */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground"
                >
                  {mode === "signin"
                    ? locale === "vi"
                      ? "Email hoặc Số điện thoại"
                      : "Email or Phone number"
                    : "Email"}
                </label>
                <input
                  id="email"
                  type={mode === "signin" ? "text" : "email"}
                  placeholder={
                    mode === "signin"
                      ? locale === "vi"
                        ? "Nhập email hoặc số điện thoại"
                        : "Enter email or phone number"
                      : t.emailPlaceholder
                  }
                  {...register("email", { required: true })}
                  className="h-12 w-full px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-sm text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  autoFocus={mode === "signin"}
                />
              </div>

              {/* Password */}
              <div className="relative flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="w-fit cursor-pointer text-xs font-medium text-foreground"
                >
                  {locale === "vi" ? "Mật khẩu" : "Password"}
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      mode === "signin"
                        ? t.passwordPlaceholder
                        : t.createPasswordPlaceholder
                    }
                    {...register("password", { required: true })}
                    className="h-12 w-full pl-4 pr-11 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-sm text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-foreground transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* "Quên mật khẩu?" - Placed absolute on label row for Tab flow */}
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      const curEmail = getValues("email");
                      setForgotValue("forgotEmail", curEmail);
                      setIsForgotModalOpen(true);
                    }}
                    className="cursor-pointer absolute top-0 right-0 text-xs font-normal text-foreground hover:underline outline-hidden"
                  >
                    {t.forgotPassword}
                  </button>
                )}

                {/* Hint for Sign up */}
                {mode === "signup" && (
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {t.passwordLengthHint}
                  </span>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer mt-2 w-full h-12 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{mode === "signin" ? t.signIn : t.signUp}</span>
                )}
              </button>
            </form>

            {/* Divider "hoặc" */}
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10"></span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{t.orDivider}</span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10"></span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="cursor-pointer w-full h-12 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-98 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-3 shadow-2xs transition-all"
            >
              {/* Google Original Colors SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>
                {mode === "signin" ? t.signInWithGoogle : t.signUpWithGoogle}
              </span>
            </button>
          </div>

          {/* Toggle between Sign in & Sign up */}
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {mode === "signin" ? (
              <>
                <span>{t.dontHaveAccount} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="cursor-pointer font-semibold text-primary hover:underline ml-1"
                >
                  {t.signUp}
                </button>
              </>
            ) : (
              <>
                <span>{t.alreadyHaveAccount} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="cursor-pointer font-semibold text-primary hover:underline ml-1"
                >
                  {t.signIn}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card dark:bg-[#151824] rounded-2xl border border-border dark:border-white/10 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {t.forgotPassword}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotStep("input");
                }}
                className="cursor-pointer text-zinc-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotStep === "input" ? (
              <form
                onSubmit={handleForgotSubmit(onForgotSubmit)}
                className="space-y-4"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {locale === "vi"
                    ? "Nhập email của bạn. Chúng tôi sẽ gửi hướng dẫn và mã đặt lại mật khẩu."
                    : "Enter your email address and we'll send you password reset instructions."}
                </p>

                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  {...registerForgot("forgotEmail", { required: true })}
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-foreground focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                />

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      resetForgot();
                    }}
                    className="cursor-pointer px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1c2030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                  >
                    {locale === "vi" ? "Gửi mã xác nhận" : "Send code"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {locale === "vi"
                      ? "Đã gửi liên kết khôi phục!"
                      : "Reset link sent!"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {locale === "vi"
                      ? `Nếu email ${sentEmail} có trong hệ thống, bạn sẽ nhận được mã sau ít phút.`
                      : `If ${sentEmail} is registered, you will receive instructions shortly.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotStep("input");
                    resetForgot();
                  }}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  {locale === "vi" ? "Đã hiểu" : "Got it"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
