import { useState, useEffect } from "react";
import { User, Bookmark, CheckCircle2, Award, ClipboardList, ShieldCheck, Heart, ArrowRight, Zap, Mail, Search, RotateCw, LogOut, Eye, X } from "lucide-react";
import { Job } from "../types";
import { initAuth, googleSignIn, fetchGmailCorrespondence, logoutGmail, SyncedEmail } from "../lib/gmailAuth";

interface DashboardProps {
  appliedJobs: { jobId: string; title: string; company: string; timestamp: Date }[];
  savedJobs: Job[];
  analysisHistory: { title: string; company: string; score: number; date: Date }[];
  interviewHistory: { title: string; score: number; rating: string; date: Date }[];
  setCurrentTab: (tab: string) => void;
  onSelectJob: (job: Job) => void;
}

export default function Dashboard({ appliedJobs, savedJobs, analysisHistory, interviewHistory, setCurrentTab, onSelectJob }: DashboardProps) {
  // Gmail Sync States
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailUser, setGmailUser] = useState<any>(null);
  const [syncedEmails, setSyncedEmails] = useState<SyncedEmail[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("CareerLink OR application OR job");
  const [selectedEmail, setSelectedEmail] = useState<SyncedEmail | null>(null);

  // Local checklist state for local regulations (saved in local memory)
  const [checklist, setChecklist] = useState({
    eiz: false,
    zica: false,
    hpcz: false,
    laz: false,
    silicosis: false,
    teveta: false,
  });

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGmailConnected(true);
        setGmailUser(user);
      },
      () => {
        setGmailConnected(false);
        setGmailUser(null);
        setSyncedEmails([]);
      }
    );
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Sync Inbox messages on demand or when connected
  const handleSyncInbox = async () => {
    if (!gmailConnected) return;
    setSyncing(true);
    try {
      const records = await fetchGmailCorrespondence(searchQuery);
      setSyncedEmails(records);
    } catch (err) {
      console.error("Failed to fetch inbox records", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (gmailConnected) {
      handleSyncInbox();
    }
  }, [gmailConnected]);

  const handleConnectGmail = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGmailConnected(true);
        setGmailUser(res.user);
      }
    } catch (err) {
      console.error("Gmail connection failed", err);
    }
  };

  const handleLogoutGmail = async () => {
    try {
      await logoutGmail();
      setGmailConnected(false);
      setGmailUser(null);
      setSyncedEmails([]);
    } catch (err) {
      console.error("Gmail logout error", err);
    }
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Tab intro */}
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-2xl font-display font-bold text-brand-green flex items-center space-x-2">
          <ClipboardList className="h-6 w-6 text-brand-orange" />
          <span>My Career Tracker & Dashboard</span>
        </h2>
        <p className="text-xs text-brand-text-dim font-semibold mt-0.5">
          Monitor your active applications, review saved jobs, track optimization scores, and manage your local professional credentials.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-stats">
        <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider block">Submitted Applications</span>
          <p className="text-3xl font-display font-bold text-brand-green">{appliedJobs.length}</p>
          <span className="text-[10px] text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded-full inline-block">
            Directly Transmitted
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider block">Saved Vacancies</span>
          <p className="text-3xl font-display font-bold text-brand-orange">{savedJobs.length}</p>
          <span className="text-[10px] text-brand-orange font-bold bg-brand-orange/10 px-2 py-0.5 rounded-full inline-block">
            Bookmarked For Review
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider block">Average Match Score</span>
          <p className="text-3xl font-display font-bold text-brand-green">
            {analysisHistory.length > 0 
              ? Math.round(analysisHistory.reduce((acc, curr) => acc + curr.score, 0) / analysisHistory.length) + "%"
              : "N/A"
            }
          </p>
          <span className="text-[10px] text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded-full inline-block">
            Verified Matches
          </span>
        </div>
      </div>

      {/* Main grids: left list trackers, right regulatory checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Trackers */}
        <div className="lg:col-span-7 space-y-6">
          {/* Applied Jobs */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-brand-green uppercase tracking-wider">
              Submitted Applications
            </h3>
            {appliedJobs.length === 0 ? (
              <div className="p-8 text-center text-brand-text-dim border border-dashed border-brand-border rounded-xl space-y-2">
                <p className="text-xs font-semibold">No active submissions</p>
                <button
                  onClick={() => setCurrentTab("jobs")}
                  className="text-xs font-bold text-brand-green hover:text-brand-orange underline cursor-pointer"
                >
                  Browse open vacancies to apply
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appliedJobs.map((app, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-brand-bg-alt/40 border border-brand-border rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-brand-text">{app.title}</h4>
                      <p className="text-[10px] text-brand-text-dim">{app.company} • Applied {app.timestamp.toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] bg-brand-green/10 text-brand-green font-bold px-2 py-0.5 rounded-full uppercase">
                      Sent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked Jobs */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-brand-green uppercase tracking-wider">
              Bookmarked Opportunities ({savedJobs.length})
            </h3>
            {savedJobs.length === 0 ? (
              <div className="p-8 text-center text-brand-text-dim border border-dashed border-brand-border rounded-xl">
                <p className="text-xs font-semibold">No saved jobs</p>
                <p className="text-[10px] text-brand-text-dim">Save jobs in the search list to keep them here for fast optimization.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map((job) => (
                  <div key={job.id} className="flex justify-between items-center p-3 bg-brand-bg-alt/40 border border-brand-border rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-brand-text">{job.title}</h4>
                      <p className="text-[10px] text-brand-text-dim">{job.company} • {job.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          onSelectJob(job);
                          setCurrentTab("jobs");
                        }}
                        className="text-[10px] bg-white border border-brand-border text-brand-text font-bold px-2.5 py-1 rounded-lg hover:bg-brand-bg-alt cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          onSelectJob(job);
                          setCurrentTab("optimizer");
                        }}
                        className="text-[10px] bg-brand-green text-white font-bold px-2.5 py-1 rounded-lg hover:bg-brand-green-dark cursor-pointer"
                      >
                        Optimize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Histories */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-brand-green uppercase tracking-wider">
              Matching History
            </h3>
            {analysisHistory.length === 0 && interviewHistory.length === 0 ? (
              <div className="p-8 text-center text-brand-text-dim border border-dashed border-brand-border rounded-xl">
                <p className="text-xs font-semibold">No history logs in this session</p>
                <p className="text-[10px]">Your matching scores and interview grades will appear here once triggered.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {analysisHistory.map((hist, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-brand-bg-alt/40 border border-brand-border rounded-xl">
                    <div>
                      <span className="text-[9px] text-brand-green font-extrabold uppercase">Resume Optimization</span>
                      <h4 className="text-xs font-bold text-brand-text">{hist.title}</h4>
                      <p className="text-[9px] text-brand-text-dim">{hist.company} • {hist.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className="text-xs font-black text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-1 rounded-lg">
                      {hist.score}% Match
                    </span>
                  </div>
                ))}

                {interviewHistory.map((hist, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-brand-bg-alt/40 border border-brand-border rounded-xl">
                    <div>
                      <span className="text-[9px] text-brand-orange font-extrabold uppercase">Interview Practice</span>
                      <h4 className="text-xs font-bold text-brand-text">{hist.title}</h4>
                      <p className="text-[9px] text-brand-text-dim">{hist.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                      hist.rating === "Excellent" ? "bg-brand-green/10 text-brand-green border border-brand-green/20" : "bg-brand-orange/15 text-brand-orange"
                    }`}>
                      {hist.rating}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gmail Recruiter Correspondence Sync */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-brand-border">
              <h3 className="text-sm font-display font-bold text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
                <Mail className="h-4.5 w-4.5 text-brand-orange" />
                <span>Synced Gmail Correspondence</span>
              </h3>
              <span className="bg-brand-green/10 text-brand-green text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-brand-green/25 uppercase tracking-wider">
                Google Workspace
              </span>
            </div>

            {gmailConnected ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-brand-text-dim font-bold">CONNECTED GOOGLE EMAIL</p>
                    <p className="text-xs font-bold text-brand-green">{gmailUser?.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSyncInbox}
                      disabled={syncing}
                      className="text-[10px] bg-white border border-brand-border text-brand-text font-bold px-3 py-1.5 rounded-lg hover:bg-brand-bg-alt flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                      <span>{syncing ? "Syncing..." : "Sync Now"}</span>
                    </button>
                    <button
                      onClick={handleLogoutGmail}
                      className="text-[10px] bg-white border border-red-200 text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>

                {/* Filter / Search queries */}
                <div className="relative flex items-center bg-brand-bg-alt/40 rounded-xl border border-brand-border p-1.5">
                  <Search className="h-4 w-4 text-brand-text-dim ml-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSyncInbox()}
                    placeholder="Filter query (e.g. interview, Zanaco)..."
                    className="w-full text-xs text-brand-text placeholder-brand-text-dim bg-transparent px-2.5 py-1 focus:outline-none font-semibold"
                  />
                  <button
                    onClick={handleSyncInbox}
                    className="bg-brand-green hover:bg-brand-green-dark text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Go
                  </button>
                </div>

                {/* Correspondence List */}
                {syncing ? (
                  <div className="p-8 text-center text-brand-text-dim space-y-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-green border-t-transparent mx-auto" />
                    <p className="text-xs font-medium">Polling your Google Workspace records securely...</p>
                  </div>
                ) : syncedEmails.length === 0 ? (
                  <div className="p-6 text-center text-brand-text-dim border border-dashed border-brand-border rounded-xl space-y-1">
                    <p className="text-xs font-semibold">No emails matched your active tracking search</p>
                    <p className="text-[10px]">Try entering a custom keyword like a company name above.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {syncedEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className="p-3 bg-brand-bg-alt/20 border border-brand-border hover:border-brand-green rounded-xl transition-all cursor-pointer flex justify-between items-start space-x-2"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono font-bold text-brand-orange truncate max-w-[150px]">
                              {email.from}
                            </span>
                            <span className="text-[9px] text-brand-text-dim font-bold flex-shrink-0 ml-2">
                              {email.date}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-brand-text truncate">
                            {email.subject}
                          </h4>
                          <p className="text-[10px] text-brand-text-dim line-clamp-1">
                            {email.snippet}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-brand-text-dim border border-dashed border-brand-border rounded-xl space-y-3">
                <p className="text-xs font-semibold">Google Sync Offline</p>
                <p className="text-[10px] max-w-sm mx-auto leading-relaxed">
                  Connect your professional Google/Gmail account to automatically track application receipts, follow-ups, and interview invite messages straight on your tracker dashboard.
                </p>
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  className="bg-brand-green hover:bg-brand-green-dark text-white text-[10px] font-black px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Synchronize my Gmail Inbox</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right checklist & tools */}
        <div className="lg:col-span-5 space-y-6">
          {/* Zambian regulatory compliance list */}
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="h-5 w-5 text-brand-orange" />
              <span>Zambian Professional Licensing Checklist</span>
            </h3>
            <p className="text-[11px] text-brand-text-dim font-medium">
              Zambian employers in regulated fields strictly prioritize candidates registered with national regulatory bodies. Mark off the credentials you have secured:
            </p>

            <div className="space-y-3 pt-1">
              {/* EIZ */}
              <div 
                onClick={() => toggleChecklist("eiz")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.eiz ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.eiz ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.eiz && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">Engineering Institution of Zambia (EIZ)</h4>
                  <p className="text-[10px] text-brand-text-dim">Required for structural, chemical, civil, agricultural, mining or electrical engineering roles.</p>
                </div>
              </div>

              {/* ZICA */}
              <div 
                onClick={() => toggleChecklist("zica")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.zica ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.zica ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.zica && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">Zambia Institute of Chartered Accountants (ZICA)</h4>
                  <p className="text-[10px] text-brand-text-dim">Mandatory for all accounting, finance, audits and corporate tax consultancy vacancies.</p>
                </div>
              </div>

              {/* HPCZ */}
              <div 
                onClick={() => toggleChecklist("hpcz")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.hpcz ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.hpcz ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.hpcz && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">Health Professions Council of Zambia (HPCZ)</h4>
                  <p className="text-[10px] text-brand-text-dim">Required for clinical research officers, medical interns, surgeons, dentists and nursing fields.</p>
                </div>
              </div>

              {/* Silicosis */}
              <div 
                onClick={() => toggleChecklist("silicosis")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.silicosis ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.silicosis ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.silicosis && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">Silicosis Certificate / Occupational Fitness</h4>
                  <p className="text-[10px] text-brand-text-dim">Required for on-site operations across Solwezi, Ndola, and Kitwe copper mining installations.</p>
                </div>
              </div>

              {/* LAZ */}
              <div 
                onClick={() => toggleChecklist("laz")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.laz ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.laz ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.laz && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">Law Association of Zambia (LAZ) Admittance</h4>
                  <p className="text-[10px] text-brand-text-dim">Mandatory for corporate counsels, contract writers, legal associates, or general practice lawyers.</p>
                </div>
              </div>

              {/* TEVETA */}
              <div 
                onClick={() => toggleChecklist("teveta")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  checklist.teveta ? "bg-brand-green/5 border-brand-green/20" : "bg-brand-bg-alt/40 border-brand-border"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center ${
                  checklist.teveta ? "bg-brand-green border-brand-green text-white" : "bg-white border-brand-border"
                }`}>
                  {checklist.teveta && <span className="text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text">TEVETA Vocational certification</h4>
                  <p className="text-[10px] text-brand-text-dim">Aids heavy equipment operators, mechanical fitters, boilermakers, electricians and logistics drivers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-brand-green text-white rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-brand-orange/15 rounded-full blur-xl" />
            <h4 className="text-xs font-black text-brand-orange-light uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="h-4 w-4 fill-brand-orange-light" />
              <span>Career Advice Corner</span>
            </h4>
            <p className="text-[11px] text-brand-bg-alt leading-relaxed font-semibold">
              Always ensure you outline your certifications in the very top block of your CV to clear automated resume screenings quickly. Use Bantu's chat module to ask specifically about the best local professional accreditation procedures.
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Detail Viewer Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedEmail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-orange">Correspondence Details</span>
              <h3 className="text-base font-black text-gray-900">{selectedEmail.subject}</h3>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 font-semibold pt-1">
                <span>From: <strong className="text-brand-green">{selectedEmail.from}</strong></span>
                <span>•</span>
                <span>Date: {selectedEmail.date}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-100">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                {selectedEmail.bodyText || selectedEmail.snippet}
              </pre>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
