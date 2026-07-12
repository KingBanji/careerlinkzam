import React, { useState, useRef } from "react";
import { ArrowLeft, X, Image as ImageIcon, Globe, User, Building2, FileText } from "lucide-react";

const colors = {
  bg: "#ffffff",
  border: "#E4E0D6", // brand-border
  bgAlt: "#F6F4EF", // brand-bg-alt
  textDim: "#6B6763", // brand-text-dim
  green: "#178A3D", // brand-green
  orange: "#E2601C", // brand-orange
  text: "#171717", // brand-text
  textOnGreen: "#ffffff"
};

const fontDisplay = "Fraunces, Georgia, serif";
const fontMono = "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace";

const inputStyle = {
  border: "1px solid #E4E0D6",
  backgroundColor: "#F6F4EF",
  color: "#171717"
};

const PROVINCES = [
  "Lusaka",
  "Copperbelt",
  "North-Western",
  "Southern",
  "Central",
  "Eastern",
  "Luapula",
  "Muchinga",
  "Northern",
  "Western"
];

interface FileDropFieldProps {
  label: string;
  hint: string;
  accept: string;
  fileName: string;
  onFile: (name: string) => void;
  icon: React.ReactNode;
}

function FileDropField({ label, hint, accept, fileName, onFile, icon }: FileDropFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0].name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0].name);
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border border-dashed border-brand-border rounded-xl p-4 text-center cursor-pointer hover:bg-brand-bg-alt/50 transition-colors flex flex-col items-center justify-center gap-1.5"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      {icon}
      <p className="text-xs font-bold text-brand-text">{fileName || label}</p>
      <p className="text-[10px] text-brand-text-dim font-medium">{hint}</p>
    </div>
  );
}

interface EmployerSignupModalProps {
  onClose: () => void;
  onBack: () => void;
  onSwitchToLogin: () => void;
  onSignUp: (profile: any) => void;
  busy: boolean;
}

export function EmployerSignupModal({ onClose, onBack, onSwitchToLogin, onSignUp, busy }: EmployerSignupModalProps) {
  const [logoFileName, setLogoFileName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!companyName.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in your company name, your name, email, and password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    onSignUp({
      role: "Employer",
      logoFileName,
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim(),
      name: name.trim(),
      email: email.trim(),
      password,
    });
  }

  return (
    <div className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 z-50" style={{ background: "rgba(20,20,20,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full rounded-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto jobscroll shadow-2xl"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex justify-between items-center mb-1 sticky -top-5 sm:-top-7 -mt-5 sm:-mt-7 pt-5 sm:pt-7 pb-1 z-10" style={{ background: colors.bg }}>
          <button onClick={onBack} className="flex items-center gap-1 py-1 pr-1 -ml-1 hover:text-brand-orange transition-colors" style={{ color: colors.textDim, fontSize: "0.8rem" }}>
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -m-2 rounded-full transition-colors hover:bg-brand-bg-alt flex-shrink-0"
          >
            <X size={18} color={colors.textDim} />
          </button>
        </div>
        <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.4rem", color: colors.green }} className="mb-1 pr-2">
          Create Employer Account
        </h2>
        <p style={{ fontFamily: fontMono, fontSize: "0.72rem", color: colors.textDim, letterSpacing: "0.1em" }} className="uppercase mb-5 font-bold">
          Company details
        </p>

        <div className="flex flex-col gap-3">
          <FileDropField
            label="Upload logo"
            hint="PNG, JPG or SVG. Up to 5 MB."
            accept="image/*"
            fileName={logoFileName}
            onFile={setLogoFileName}
            icon={<ImageIcon size={22} color={colors.orange} className="flex-shrink-0" />}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={inputStyle}>
            <Globe size={15} color={colors.textDim} className="flex-shrink-0" />
            <input
              className="jobinput bg-transparent outline-none w-full text-sm font-semibold"
              style={{ color: colors.text }}
              placeholder="Company Website"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <p style={{ fontFamily: fontMono, fontSize: "0.72rem", color: colors.textDim, letterSpacing: "0.1em" }} className="uppercase mt-2 mb-1 font-bold">
            Your account details
          </p>
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p style={{ color: colors.orange, fontSize: "0.8rem" }} className="font-bold">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full py-3 rounded-full font-bold mt-1 text-sm tracking-wide transition-all shadow-md cursor-pointer"
            style={{ background: colors.green, color: colors.textOnGreen, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Please wait…" : "Create account"}
          </button>
        </div>

        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mt-4 text-center font-semibold">
          Already registered?{" "}
          <button onClick={onSwitchToLogin} style={{ color: colors.orange }} className="underline font-bold">Sign in</button>
        </p>
      </div>
    </div>
  );
}

interface JobSeekerSignupModalProps {
  onClose: () => void;
  onBack: () => void;
  onSwitchToLogin: () => void;
  onSignUp: (profile: any) => void;
  busy: boolean;
}

export function JobSeekerSignupModal({ onClose, onBack, onSwitchToLogin, onSignUp, busy }: JobSeekerSignupModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState(PROVINCES[0]);
  const [resumeFileName, setResumeFileName] = useState("");
  const [availableForWork, setAvailableForWork] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in your first name, last name, email, and password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    onSignUp({
      role: "Job Seeker",
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      headline: headline.trim(),
      email: email.trim(),
      location,
      resumeFileName,
      availableForWork,
      password,
    });
  }

  return (
    <div className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 z-50" style={{ background: "rgba(20,20,20,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full rounded-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto jobscroll shadow-2xl"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex justify-between items-center mb-1 sticky -top-5 sm:-top-7 -mt-5 sm:-mt-7 pt-5 sm:pt-7 pb-1 z-10" style={{ background: colors.bg }}>
          <button onClick={onBack} className="flex items-center gap-1 py-1 pr-1 -ml-1 hover:text-brand-orange transition-colors" style={{ color: colors.textDim, fontSize: "0.8rem" }}>
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -m-2 rounded-full transition-colors hover:bg-brand-bg-alt flex-shrink-0"
          >
            <X size={18} color={colors.textDim} />
          </button>
        </div>
        <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.4rem", color: colors.green }} className="mb-1 pr-2">
          Create Job Seeker Account
        </h2>
        <p style={{ fontFamily: fontMono, fontSize: "0.72rem", color: colors.textDim, letterSpacing: "0.1em" }} className="uppercase mb-5 font-bold">
          Your account details
        </p>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
              style={inputStyle}
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
              style={inputStyle}
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Headline (e.g. Mine Surveyor, 4 years experience)"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <p style={{ fontFamily: fontMono, fontSize: "0.7rem", color: colors.textDim, letterSpacing: "0.05em" }} className="uppercase mb-1.5 font-bold">Location</p>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold bg-brand-bg-alt border border-brand-border"
            >
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <FileDropField
            label="Resume"
            hint="Allows *.pdf, *.doc, *.docx, *.odt or *.txt file. Up to 5 MB."
            accept=".pdf,.doc,.docx,.odt,.txt"
            fileName={resumeFileName}
            onFile={setResumeFileName}
            icon={<FileText size={22} color={colors.orange} className="flex-shrink-0" />}
          />

          <button
            type="button"
            onClick={() => setAvailableForWork((v) => !v)}
            className="flex items-center justify-between p-3 rounded-xl text-left hover:brightness-95 transition-all cursor-pointer"
            style={{ background: colors.bgAlt, border: `1px solid ${colors.border}` }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: colors.text, fontWeight: 600 }}>Available for work</p>
              <p style={{ color: colors.textDim, fontSize: "0.72rem" }} className="mt-0.5 font-semibold leading-normal">
                Employers will be able to view your profile and contact you only if it's set to available.
              </p>
            </div>
            <span
              className="flex-shrink-0 ml-3 rounded-full transition-colors"
              style={{ width: 40, height: 22, background: availableForWork ? colors.green : colors.border, position: "relative" }}
            >
              <span
                className="rounded-full transition-transform"
                style={{
                  width: 16, height: 16, background: colors.bg, position: "absolute", top: 3,
                  left: availableForWork ? 21 : 3,
                }}
              />
            </span>
          </button>

          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p style={{ color: colors.orange, fontSize: "0.8rem" }} className="font-bold">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full py-3 rounded-full font-bold mt-1 text-sm tracking-wide transition-all shadow-md cursor-pointer"
            style={{ background: colors.green, color: colors.textOnGreen, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Please wait…" : "Create account"}
          </button>
        </div>

        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mt-4 text-center font-semibold">
          Already registered?{" "}
          <button onClick={onSwitchToLogin} style={{ color: colors.orange }} className="underline font-bold">Sign in</button>
          {" · "}
          <button onClick={onBack} style={{ color: colors.orange }} className="underline font-bold">Employer Sign Up</button>
        </p>
      </div>
    </div>
  );
}

interface LoginModalProps {
  onClose: () => void;
  onSwitchToChoice: () => void;
  onLogIn: (credentials: any) => void;
  busy: boolean;
}

export function LoginModal({ onClose, onSwitchToChoice, onLogIn, busy }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  function submit() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    onLogIn({ email: email.trim(), password });
  }

  function handleResetSubmit() {
    setError("");
    setResetSuccess("");
    if (!resetEmail.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setResetSuccess(`Password reset instructions have been dispatched to ${resetEmail.trim()}! Please check your inbox.`);
  }

  if (resetMode) {
    return (
      <div className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 z-50" style={{ background: "rgba(20,20,20,0.6)" }} onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-w-sm w-full rounded-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto jobscroll shadow-2xl"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <div className="flex justify-between items-center mb-1 sticky -top-5 sm:-top-7 -mt-5 sm:-mt-7 pt-5 sm:pt-7 pb-1 z-10" style={{ background: colors.bg }}>
            <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.4rem", color: colors.green }}>Reset Password</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 -m-2 rounded-full transition-colors hover:bg-brand-bg-alt flex-shrink-0"
            >
              <X size={18} color={colors.textDim} />
            </button>
          </div>
          <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mb-5 font-semibold">Enter your email and we'll send reset instructions.</p>

          <div className="flex flex-col gap-3">
            <input
              className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
              style={inputStyle}
              placeholder="Registered Email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            {error && <p style={{ color: colors.orange, fontSize: "0.8rem" }} className="font-bold">{error}</p>}
            {resetSuccess && <p className="text-xs text-brand-green font-bold bg-brand-green/10 p-2.5 rounded-lg border border-brand-green/20 leading-relaxed">{resetSuccess}</p>}
            
            <button
              onClick={handleResetSubmit}
              className="w-full py-3 rounded-full font-bold mt-1 text-sm tracking-wide transition-all shadow-md cursor-pointer"
              style={{ background: colors.green, color: colors.textOnGreen }}
            >
              Send Reset Code
            </button>

            <button
              onClick={() => {
                setResetMode(false);
                setError("");
                setResetSuccess("");
              }}
              className="text-xs font-bold text-brand-orange hover:underline text-center mt-1"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 z-50" style={{ background: "rgba(20,20,20,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full rounded-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto jobscroll shadow-2xl"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex justify-between items-center mb-1 sticky -top-5 sm:-top-7 -mt-5 sm:-mt-7 pt-5 sm:pt-7 pb-1 z-10" style={{ background: colors.bg }}>
          <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.4rem", color: colors.green }}>Log in</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -m-2 rounded-full transition-colors hover:bg-brand-bg-alt flex-shrink-0"
          >
            <X size={18} color={colors.textDim} />
          </button>
        </div>
        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mb-5 font-semibold">Welcome back.</p>

        <div className="flex flex-col gap-3">
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="jobinput px-3 py-2 rounded-lg text-base sm:text-sm outline-none w-full font-semibold"
            style={inputStyle}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="text-right">
            <button
              onClick={() => {
                setResetMode(true);
                setError("");
              }}
              type="button"
              className="text-[11px] font-bold text-brand-orange hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          {error && <p style={{ color: colors.orange, fontSize: "0.8rem" }} className="font-bold">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full py-3 rounded-full font-bold mt-1 text-sm tracking-wide transition-all shadow-md cursor-pointer"
            style={{ background: colors.green, color: colors.textOnGreen, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Please wait…" : "Log in"}
          </button>
        </div>

        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mt-4 text-center font-semibold">
          New to CareerLink Zambia?{" "}
          <button onClick={onSwitchToChoice} style={{ color: colors.orange }} className="underline font-bold">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

interface RoleChoiceModalProps {
  onClose: () => void;
  onChoose: (role: "Job Seeker" | "Employer") => void;
  onSwitchToLogin: () => void;
}

export function RoleChoiceModal({ onClose, onChoose, onSwitchToLogin }: RoleChoiceModalProps) {
  return (
    <div className="fixed inset-0 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 py-6 sm:py-10 z-50" style={{ background: "rgba(20,20,20,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full rounded-2xl p-5 sm:p-7 max-h-[90vh] overflow-y-auto jobscroll shadow-2xl"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex justify-between items-center mb-1 sticky -top-5 sm:-top-7 -mt-5 sm:-mt-7 pt-5 sm:pt-7 pb-1 z-10" style={{ background: colors.bg }}>
          <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.4rem", color: colors.green }}>Create an account</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 -m-2 rounded-full transition-colors hover:bg-brand-bg-alt flex-shrink-0"
          >
            <X size={18} color={colors.textDim} />
          </button>
        </div>
        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mb-5 font-semibold leading-normal">
          Job seekers and employers sign up separately on CareerLink Zambia.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onChoose("Job Seeker")}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-colors hover:bg-brand-bg-alt/50 border border-brand-border cursor-pointer"
          >
            <User size={20} color={colors.green} />
            <div>
              <p style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "0.95rem", color: colors.text }}>Job Seeker</p>
              <p style={{ color: colors.textDim, fontSize: "0.78rem" }} className="font-semibold leading-normal">Build a profile and apply to jobs.</p>
            </div>
          </button>
          <button
            onClick={() => onChoose("Employer")}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-colors hover:bg-brand-bg-alt/50 border border-brand-border cursor-pointer"
          >
            <Building2 size={20} color={colors.green} />
            <div>
              <p style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "0.95rem", color: colors.text }}>Employer</p>
              <p style={{ color: colors.textDim, fontSize: "0.78rem" }} className="font-semibold leading-normal">Post jobs and find candidates.</p>
            </div>
          </button>
        </div>

        <p style={{ color: colors.textDim, fontSize: "0.8rem" }} className="mt-4 text-center font-semibold">
          Already registered?{" "}
          <button onClick={onSwitchToLogin} style={{ color: colors.orange }} className="underline font-bold">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
