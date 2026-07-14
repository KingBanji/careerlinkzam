import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BrainCircuit, MessageSquare, ShieldCheck, FileText, Lock } from "lucide-react";
import Header from "./components/Header";
import JobList from "./components/JobList";
import ResumeOptimizer from "./components/ResumeOptimizer";
import InterviewPrep from "./components/InterviewPrep";
import CareerAdvisor from "./components/CareerAdvisor";
import PostJob from "./components/PostJob";
import Dashboard from "./components/Dashboard";
import { Job } from "./types";
import { RoleChoiceModal, JobSeekerSignupModal, EmployerSignupModal, LoginModal } from "./components/AuthModals";

import { db } from "./lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { googleSignIn } from "./lib/gmailAuth";
import CandidateDatabase from "./components/CandidateDatabase";
import AdminPanel from "./components/AdminPanel";
import AboutUs from "./components/AboutUs";

export default function App() {
  const [currentTab, setCurrentTab] = useState("jobs");
  
  // Sidebar & Admin token states
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAdminSecretModal, setShowAdminSecretModal] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [adminTokenError, setAdminTokenError] = useState("");
  
  // Auth state
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authMode, setAuthMode] = useState<"choice" | "seeker-signup" | "employer-signup" | "login" | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Storage accessors with safe localStorage fallback
  const getStorageItem = async (key: string, isGlobal: boolean): Promise<{ value: string | null } | null> => {
    // @ts-ignore
    if (window.storage && typeof window.storage.get === "function") {
      // @ts-ignore
      return window.storage.get(key, isGlobal);
    }
    const val = localStorage.getItem(key);
    return { value: val };
  };

  const setStorageItem = async (key: string, value: string, isGlobal: boolean): Promise<any> => {
    // @ts-ignore
    if (window.storage && typeof window.storage.set === "function") {
      // @ts-ignore
      return window.storage.set(key, value, isGlobal);
    }
    localStorage.setItem(key, value);
  };

  // Auth operations
  async function handleGoogleAuth(forcedRole?: "Job Seeker" | "Employer") {
    setAuthBusy(true);
    try {
      const res = await googleSignIn();
      if (!res) {
        setToast("Google login was not completed.");
        setAuthBusy(false);
        return;
      }
      const { user: googleUser } = res;
      const email = googleUser.email?.toLowerCase().trim();
      if (!email) {
        setToast("Google account doesn't have a valid email.");
        setAuthBusy(false);
        return;
      }

      // Check if user exists in Firestore
      const docRef = doc(db, "users", email);
      const docSnap = await getDoc(docRef);
      let finalUser: any = null;

      if (docSnap.exists()) {
        const data = docSnap.data();
        finalUser = {
          name: data.name || googleUser.displayName || "Google Seeker",
          email: data.email || email,
          role: data.role || forcedRole || "Job Seeker",
          phone: data.phone || "",
          headline: data.headline || "Zambian Professional Profile",
          location: data.location || "Lusaka",
          bio: data.bio || "",
          availableForWork: data.availableForWork !== false,
          resumeFileName: data.resumeFileName || "",
        };
      } else {
        // Register a new Job Seeker / Employer with defaults
        const role = forcedRole || "Job Seeker";
        const name = googleUser.displayName || "Google Seeker";
        finalUser = {
          name,
          email,
          role,
          phone: "",
          headline: "Verified Google Profile",
          location: "Lusaka",
          bio: "Passionate professional seeking opportunities in Zambia.",
          availableForWork: true,
          resumeFileName: "",
          createdAt: new Date().toISOString()
        };

        // Write directly to Firestore users collection
        await setDoc(docRef, finalUser);

        // Seed candidate database if Job Seeker
        if (role === "Job Seeker") {
          try {
            const names = name.split(" ");
            const firstName = names[0] || "Google";
            const lastName = names.slice(1).join(" ") || "User";
            await setDoc(doc(db, "candidates", "cand-g-" + googleUser.uid), {
              id: "cand-g-" + googleUser.uid,
              firstName,
              lastName,
              email,
              headline: "Verified Google Profile",
              location: "Lusaka",
              availableForWork: true,
              createdAt: new Date().toISOString()
            });
          } catch (candidateErr) {
            console.warn("Failed to seed candidate record:", candidateErr);
          }
        }
      }

      // Sync with local session
      const usersRes = await getStorageItem("users-list", true);
      const users = usersRes && usersRes.value ? JSON.parse(usersRes.value) : [];
      const existsIndex = users.findIndex((u: any) => u.email.toLowerCase() === email);
      if (existsIndex > -1) {
        users[existsIndex] = { ...users[existsIndex], ...finalUser };
      } else {
        users.push(finalUser);
      }
      await setStorageItem("users-list", JSON.stringify(users), true);
      await setStorageItem("session-email", email, false);

      setUser(finalUser);
      setAuthMode(null);
      setToast(`Welcome, ${finalUser.name}. Signed in via Google.`);
    } catch (err) {
      console.error("Google auth failure:", err);
      setToast("Could not complete Google authentication — please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleUpdateUser(updatedData: any) {
    if (!user?.email) return;
    try {
      const email = user.email.toLowerCase().trim();
      const userDocRef = doc(db, "users", email);
      const mergedUser = {
        ...user,
        ...updatedData,
        email
      };

      // Save directly to Firestore for persistent user routing
      await setDoc(userDocRef, mergedUser, { merge: true });

      // If they are a Job Seeker, also keep their searchable candidate record in sync
      if (user.role === "Job Seeker") {
        const names = mergedUser.name.split(" ");
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";
        const safeId = "cand-" + email.replace(/[@.]/g, "-");
        await setDoc(doc(db, "candidates", safeId), {
          id: safeId,
          firstName,
          lastName,
          email,
          phone: mergedUser.phone || "",
          headline: mergedUser.headline || "Zambian Professional",
          location: mergedUser.location || "Lusaka",
          bio: mergedUser.bio || "",
          availableForWork: mergedUser.availableForWork !== false,
          resumeFileName: mergedUser.resumeFileName || "",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Sync with local session list
      const usersRes = await getStorageItem("users-list", true);
      const users = usersRes && usersRes.value ? JSON.parse(usersRes.value) : [];
      const idx = users.findIndex((u: any) => u.email.toLowerCase() === email);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...mergedUser };
      } else {
        users.push(mergedUser);
      }
      await setStorageItem("users-list", JSON.stringify(users), true);

      setUser(mergedUser);
      setToast("Digital profile successfully synchronized with cloud servers.");
    } catch (err) {
      console.error("Failed to persist profile updates:", err);
      setToast("Failed to sync profile changes with the database.");
      throw err;
    }
  }

  async function handleSignUp(profile: any) {
    setAuthBusy(true);
    try {
      const usersRes = await getStorageItem("users-list", true);
      const users = usersRes && usersRes.value ? JSON.parse(usersRes.value) : [];
      if (users.some((u: any) => u.email.toLowerCase() === profile.email.toLowerCase())) {
        setToast("An account with that email already exists — try logging in instead.");
        setAuthBusy(false);
        return;
      }
      const displayName = profile.role === "Job Seeker"
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : profile.name;
      const newUser = { ...profile, name: displayName, createdAt: new Date().toISOString() };
      
      // Save directly to Firestore users collection for persistent real data backend routing
      try {
        await setDoc(doc(db, "users", profile.email.toLowerCase().trim()), {
          name: displayName,
          email: profile.email.toLowerCase().trim(),
          role: profile.role,
          createdAt: new Date().toISOString()
        });
      } catch (firestoreErr) {
        console.warn("Firestore signup sync warning:", firestoreErr);
      }

      const updatedUsers = [...users, newUser];
      await setStorageItem("users-list", JSON.stringify(updatedUsers), true);
      await setStorageItem("session-email", profile.email, false);
      setUser({ name: displayName, email: profile.email, role: profile.role });
      setAuthMode(null);
      setToast(`Welcome, ${displayName}. You're signed in as a ${profile.role.toLowerCase()}.`);
    } catch (e) {
      setToast("Couldn't create your account — please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogIn({ email, password }: any) {
    setAuthBusy(true);
    try {
      const usersRes = await getStorageItem("users-list", true);
      const users = usersRes && usersRes.value ? JSON.parse(usersRes.value) : [];
      let found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      // Sync or retrieve from Firestore as premium real fallback path
      if (!found) {
        try {
          const docRef = doc(db, "users", email.toLowerCase().trim());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const fireUser = docSnap.data();
            found = {
              name: fireUser.name,
              email: fireUser.email,
              role: fireUser.role,
              password: password
            };
            // Sync locally
            await setStorageItem("users-list", JSON.stringify([...users, found]), true);
          }
        } catch (firestoreErr) {
          console.warn("Firestore login fetch warning:", firestoreErr);
        }
      }

      if (!found) {
        setToast("We couldn't find a matching account. Check your details or sign up.");
        setAuthBusy(false);
        return;
      }
      await setStorageItem("session-email", found.email, false);
      setUser({ name: found.name, email: found.email, role: found.role });
      setAuthMode(null);
      setToast(`Welcome back, ${found.name}.`);
    } catch (e) {
      setToast("Couldn't log you in — please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  const handleLogOut = async () => {
    try {
      await setStorageItem("session-email", "", false);
      setUser(null);
      setToast("Logged out successfully.");
    } catch (e) {
      setToast("Error logging out.");
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionEmailRes = await getStorageItem("session-email", false);
        const sessionEmail = sessionEmailRes?.value;
        if (sessionEmail) {
          const usersRes = await getStorageItem("users-list", true);
          const users = usersRes && usersRes.value ? JSON.parse(usersRes.value) : [];
          let found = users.find((u: any) => u.email.toLowerCase() === sessionEmail.toLowerCase());
          
          if (!found) {
            try {
              const docSnap = await getDoc(doc(db, "users", sessionEmail.toLowerCase().trim()));
              if (docSnap.exists()) {
                const fireUser = docSnap.data();
                found = {
                  name: fireUser.name,
                  email: fireUser.email,
                  role: fireUser.role
                };
              }
            } catch (firestoreErr) {
              console.warn("Firestore loadSession sync warning:", firestoreErr);
            }
          }

          if (found) {
            setUser({ name: found.name, email: found.email, role: found.role });
          }
        }
      } catch (e) {
        console.error("Failed to load user session:", e);
      }
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // App-wide state
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<{ jobId: string; title: string; company: string; timestamp: Date }[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<{ title: string; company: string; score: number; date: Date }[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<{ title: string; score: number; rating: string; date: Date }[]>([]);

  // Cross-tab interaction targets
  const [selectedJobForOptimization, setSelectedJobForOptimization] = useState<Job | null>(null);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState<Job | null>(null);

  // Raw jobs storage (to map bookmarked IDs to details)
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  // Fetch all jobs periodically to keep dashboard synced
  const fetchAllJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setAllJobs(data);
      }
    } catch (err) {
      console.error("Failed to sync jobs mapping database:", err);
    }
  };

  useEffect(() => {
    fetchAllJobs();
  }, [currentTab]); // Sync whenever user shifts tabs to capture newly posted jobs

  // Actions
  const toggleSaveJob = (id: string) => {
    setSavedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addAppliedJob = (jobId: string, title: string, company: string) => {
    setAppliedJobs((prev) => [
      ...prev,
      { jobId, title, company, timestamp: new Date() },
    ]);
  };

  const addAnalysisToHistory = (title: string, company: string, score: number) => {
    setAnalysisHistory((prev) => [
      ...prev,
      { title, company, score, date: new Date() },
    ]);
  };

  const addInterviewToHistory = (title: string, score: number, rating: string) => {
    setInterviewHistory((prev) => [
      ...prev,
      { title, score, rating, date: new Date() },
    ]);
  };

  // Launch Resume Optimizer
  const onOptimizeForJob = (job: Job) => {
    setSelectedJobForOptimization(job);
    setCurrentTab("optimizer");
  };

  // Launch Interview Prep
  const onPracticeForJob = (job: Job) => {
    setSelectedJobForInterview(job);
    setCurrentTab("interview");
  };

  const handleAdminTokenSubmit = () => {
    if (adminTokenInput.trim() === "career24admin") {
      setUser({
        name: "Super Admin",
        email: "luyandobanjilb@gmail.com",
        role: "Admin"
      });
      setShowAdminSecretModal(false);
      setAdminTokenInput("");
      setAdminTokenError("");
      setCurrentTab("admin");
      setToast("Authenticated as Super Administrator successfully.");
    } else {
      setAdminTokenError("Invalid admin passcode token. Please retry.");
    }
  };

  // Select job from dashboard (to display in details)
  const onSelectJob = (job: Job) => {
    // Setting state so that details pane can load if matches
  };

  // Resolve bookmarked job IDs to full Job details
  const bookmarkedJobs = allJobs.filter((job) => savedJobIds.includes(job.id));

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans" id="app-root-container">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedJobsCount={savedJobIds.length}
        user={user}
        onLoginClick={() => setAuthMode("login")}
        onSignUpClick={() => setAuthMode("choice")}
        onLogoutClick={handleLogOut}
        onAdminTriggerClick={() => {
          setShowAdminSecretModal(true);
        }}
        onOpenAiSuite={() => setShowAiSidebar(true)}
      />

      {/* Primary Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="primary-workspace-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            id={`tab-wrapper-${currentTab}`}
          >
            {currentTab === "jobs" && (
              <JobList
                onOptimizeForJob={onOptimizeForJob}
                onPracticeForJob={onPracticeForJob}
                savedJobs={savedJobIds}
                toggleSaveJob={toggleSaveJob}
                addAppliedJob={addAppliedJob}
                onOpenAiSuite={() => setShowAiSidebar(true)}
              />
            )}

            {currentTab === "candidates" && (
              <CandidateDatabase
                user={user}
                onShowToast={(msg) => setToast(msg)}
                onLoginClick={() => setAuthMode("login")}
              />
            )}

            {currentTab === "admin" && (
              <AdminPanel
                user={user}
                onShowToast={(msg) => setToast(msg)}
              />
            )}

            {currentTab === "optimizer" && (
              <ResumeOptimizer
                selectedJobForOptimization={selectedJobForOptimization}
                clearSelectedJob={() => setSelectedJobForOptimization(null)}
                addAnalysisToHistory={addAnalysisToHistory}
              />
            )}

            {currentTab === "interview" && (
              <InterviewPrep
                selectedJobForInterview={selectedJobForInterview}
                clearSelectedJob={() => setSelectedJobForInterview(null)}
                addInterviewToHistory={addInterviewToHistory}
              />
            )}

            {currentTab === "bantu" && <CareerAdvisor />}

            {currentTab === "about" && <AboutUs />}

            {currentTab === "post-job" && <PostJob onJobPosted={fetchAllJobs} />}

            {currentTab === "dashboard" && (
              <Dashboard
                appliedJobs={appliedJobs}
                savedJobs={bookmarkedJobs}
                analysisHistory={analysisHistory}
                interviewHistory={interviewHistory}
                setCurrentTab={setCurrentTab}
                onSelectJob={onSelectJob}
                user={user}
                onUpdateUser={handleUpdateUser}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Auth Modals Container */}
      <AnimatePresence>
        {authMode === "choice" && (
          <RoleChoiceModal
            onClose={() => setAuthMode(null)}
            onChoose={(role) => setAuthMode(role === "Job Seeker" ? "seeker-signup" : "employer-signup")}
            onSwitchToLogin={() => setAuthMode("login")}
            onGoogleAuth={() => handleGoogleAuth("Job Seeker")}
          />
        )}
        {authMode === "seeker-signup" && (
          <JobSeekerSignupModal
            onClose={() => setAuthMode(null)}
            onBack={() => setAuthMode("choice")}
            onSwitchToLogin={() => setAuthMode("login")}
            onSignUp={handleSignUp}
            onGoogleSignUp={() => handleGoogleAuth("Job Seeker")}
            busy={authBusy}
          />
        )}
        {authMode === "employer-signup" && (
          <EmployerSignupModal
            onClose={() => setAuthMode(null)}
            onBack={() => setAuthMode("choice")}
            onSwitchToLogin={() => setAuthMode("login")}
            onSignUp={handleSignUp}
            busy={authBusy}
          />
        )}
        {authMode === "login" && (
          <LoginModal
            onClose={() => setAuthMode(null)}
            onSwitchToChoice={() => setAuthMode("choice")}
            onLogIn={handleLogIn}
            onGoogleLogin={() => handleGoogleAuth()}
            busy={authBusy}
          />
        )}
      </AnimatePresence>



      {/* Sliding AI Sidebar Drawer */}
      <AnimatePresence>
        {showAiSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiSidebar(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 cursor-pointer"
              id="ai-sidebar-backdrop"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-brand-border shadow-2xl z-50 p-6 flex flex-col justify-between"
              id="ai-sidebar-drawer"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                  <div className="flex items-center space-x-2">
                    <BrainCircuit className="h-5 w-5 text-brand-orange" />
                    <span className="font-display font-extrabold text-brand-green text-sm uppercase tracking-wide">Bantu AI Suite</span>
                  </div>
                  <button
                    onClick={() => setShowAiSidebar(false)}
                    className="p-1.5 rounded-full hover:bg-brand-bg-alt text-brand-text-dim hover:text-brand-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-brand-text-dim leading-relaxed">
                  Bantu Professional AI helps you stay ahead of the competition with direct intelligence and tailor-made career assets.
                </p>

                {/* List of the 3 AI Tools */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      setCurrentTab("optimizer");
                      setShowAiSidebar(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                      currentTab === "optimizer"
                        ? "bg-brand-bg-alt border-brand-green text-brand-green"
                        : "bg-brand-bg-alt/20 border-brand-border hover:border-brand-green/40"
                    }`}
                  >
                    <FileText className="h-5 w-5 text-brand-green mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Resume Optimizer</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Align your professional experience against official Zambian vacancy requirements.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab("interview");
                      setShowAiSidebar(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                      currentTab === "interview"
                        ? "bg-brand-bg-alt border-brand-green text-brand-green"
                        : "bg-brand-bg-alt/20 border-brand-border hover:border-brand-green/40"
                    }`}
                  >
                    <BrainCircuit className="h-5 w-5 text-brand-orange mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Interview Prep</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Run deep-dive interactive oral exam questions mapped to local regulations.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab("bantu");
                      setShowAiSidebar(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                      currentTab === "bantu"
                        ? "bg-brand-bg-alt border-brand-green text-brand-green"
                        : "bg-brand-bg-alt/20 border-brand-border hover:border-brand-green/40"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 text-brand-green mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Bantu Career AI</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Discuss compliance, pay-grades, and market shifts with our smart advisor.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Drawer Footer info */}
              <div className="pt-4 border-t border-brand-border text-center">
                <span className="text-[9px] font-mono font-bold tracking-wider text-brand-text-dim block uppercase">Bantu Engine Core v2.4</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">CareerLink Zambia Professional Hub</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Secret Admin Verification Modal */}
      <AnimatePresence>
        {showAdminSecretModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" id="secret-admin-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-brand-border rounded-2xl p-6 shadow-2xl max-w-sm w-full relative space-y-4"
            >
              <button
                onClick={() => {
                  setShowAdminSecretModal(false);
                  setAdminTokenInput("");
                  setAdminTokenError("");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 p-1"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1.5 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900 font-display">Administrator Access</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter the canonical passcode token to access the complete CareerLink administrative suite.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter passcode token"
                  value={adminTokenInput}
                  onChange={(e) => {
                    setAdminTokenInput(e.target.value);
                    setAdminTokenError("");
                  }}
                  className="w-full text-center text-xs border border-brand-border rounded-xl p-3 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-green font-mono"
                  id="admin-token-password-field"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminTokenSubmit();
                    }
                  }}
                />
                {adminTokenError && (
                  <p className="text-[10px] text-red-500 font-bold text-center">{adminTokenError}</p>
                )}

                <button
                  onClick={handleAdminTokenSubmit}
                  className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-slate-900 font-extrabold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Authorize Access
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg border border-slate-800 text-xs font-bold flex items-center space-x-2"
          >
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="hover:text-brand-orange-light ml-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Us Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" id="about-us-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setShowAboutModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 p-1.5 transition-all cursor-pointer z-50"
                id="close-about-modal"
              >
                <X className="h-5 w-5" />
              </button>
              <AboutUs />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-border py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs font-semibold text-brand-text-dim">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://www.careerlinkjobzambia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green hover:text-brand-orange hover:underline font-bold"
            >
              www.careerlinkjobzambia.com
            </a>
            . Driving Professional Excellence across Lusaka, Solwezi, and the Copperbelt.
          </p>
          <div className="flex justify-center space-x-4 text-[10px] font-bold text-brand-green flex-wrap">
            <a href="https://www.careerlinkjobzambia.com" className="hover:text-brand-orange transition-colors">
              Official Site
            </a>
            <span className="text-brand-border">•</span>
            <button 
              onClick={() => setShowAboutModal(true)} 
              className="hover:text-brand-orange cursor-pointer transition-colors font-bold"
              id="footer-about-us-button"
            >
              About Us & Story
            </button>
            <span className="text-brand-border">•</span>
            <a href="#" className="hover:text-brand-orange transition-colors">Terms of Service</a>
            <span className="text-brand-border">•</span>
            <a href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</a>
            <span className="text-brand-border">•</span>
            <button 
              onClick={() => setShowAdminSecretModal(true)} 
              className="hover:text-brand-orange cursor-pointer transition-colors font-bold underline"
              id="footer-admin-trigger-word"
            >
              careerlink zambia jobs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
