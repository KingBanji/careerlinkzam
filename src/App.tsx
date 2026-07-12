import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import Header from "./components/Header";
import JobList from "./components/JobList";
import ResumeOptimizer from "./components/ResumeOptimizer";
import InterviewPrep from "./components/InterviewPrep";
import CareerAdvisor from "./components/CareerAdvisor";
import PostJob from "./components/PostJob";
import Dashboard from "./components/Dashboard";
import { Job } from "./types";
import { RoleChoiceModal, JobSeekerSignupModal, EmployerSignupModal, LoginModal } from "./components/AuthModals";

export default function App() {
  const [currentTab, setCurrentTab] = useState("jobs");
  
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
      const newUser = { ...profile, name: displayName };
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
      const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
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
          const found = users.find((u: any) => u.email.toLowerCase() === sessionEmail.toLowerCase());
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

            {currentTab === "post-job" && <PostJob onJobPosted={fetchAllJobs} />}

            {currentTab === "dashboard" && (
              <Dashboard
                appliedJobs={appliedJobs}
                savedJobs={bookmarkedJobs}
                analysisHistory={analysisHistory}
                interviewHistory={interviewHistory}
                setCurrentTab={setCurrentTab}
                onSelectJob={onSelectJob}
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
          />
        )}
        {authMode === "seeker-signup" && (
          <JobSeekerSignupModal
            onClose={() => setAuthMode(null)}
            onBack={() => setAuthMode("choice")}
            onSwitchToLogin={() => setAuthMode("login")}
            onSignUp={handleSignUp}
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
            busy={authBusy}
          />
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

      {/* Footer */}
      <footer className="bg-white border-t border-brand-border py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs font-semibold text-brand-text-dim">
            © {new Date().getFullYear()} CareerLink Zambia. Driving Professional Excellence across Lusaka, Solwezi, and the Copperbelt.
          </p>
          <div className="flex justify-center space-x-4 text-[10px] font-bold text-brand-green">
            <a href="#" className="hover:text-brand-orange transition-colors">Terms of Service</a>
            <span className="text-brand-border">•</span>
            <a href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</a>
            <span className="text-brand-border">•</span>
            <a href="#" className="hover:text-brand-orange transition-colors">Zambian Compliance Standards</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
