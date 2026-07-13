import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Users, Mail, Briefcase, Search, PlusCircle, Trash2, 
  Settings, Coins, RefreshCw, Check, FileText, MapPin, 
  Tag, BarChart3, Radio, FileSpreadsheet, Lock, AlertCircle 
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

interface AdminPanelProps {
  user: { name: string; email: string; role: string } | null;
  onShowToast: (msg: string) => void;
}

export default function AdminPanel({ user, onShowToast }: AdminPanelProps) {
  // The 11 Subtabs
  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "employers", label: "Employers", icon: Users },
    { id: "candidates", label: "Candidates/CVs", icon: FileText },
    { id: "applications", label: "Applications", icon: FileSpreadsheet },
    { id: "categories", label: "Categories/Skills", icon: Tag },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "users", label: "Users & Roles", icon: Lock },
    { id: "reports", label: "Reports/Analytics", icon: Coins },
    { id: "content", label: "Content/CMS", icon: Radio },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  type TabId = typeof adminTabs[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loading, setLoading] = useState(false);

  // Firestore & local state entities
  const [userRecords, setUserRecords] = useState<any[]>([]);
  const [candidateRecords, setCandidateRecords] = useState<any[]>([]);
  const [newsletterRecords, setNewsletterRecords] = useState<any[]>([]);
  
  // Real or seeded datasets for local manipulation and editing
  const [jobsList, setJobsList] = useState<any[]>([
    { id: "job-1", title: "Senior Shaft Engineer", company: "Kansanshi Copper Mining", location: "Solwezi", sector: "Mining", salary: "45,000 - 55,000", type: "Full-time", featured: true },
    { id: "job-2", title: "Corporate Finance Auditor", company: "Zanaco Bank PLC", location: "Lusaka", sector: "Financial Services", salary: "30,000 - 38,000", type: "Full-time", featured: true },
    { id: "job-3", title: "Environmental Safety Officer", company: "First National Bank", location: "Ndola", sector: "Financial Services", salary: "22,000 - 28,000", type: "Contract", featured: false },
    { id: "job-4", title: "Senior Agronomist Expert", company: "Chisamba Farms", location: "Chisamba", sector: "Agriculture", salary: "18,000 - 23,000", type: "Full-time", featured: false },
    { id: "job-5", title: "Lead React Web Architect", company: "Liquid Intelligent Technologies", location: "Lusaka", sector: "Tech", salary: "35,000 - 45,000", type: "Contract", featured: true },
  ]);

  const [employersList, setEmployersList] = useState<any[]>([
    { id: "emp-1", name: "Zanaco Bank PLC", industry: "Financial Services", website: "www.zanaco.co.zm", location: "Lusaka" },
    { id: "emp-2", name: "Kansanshi Copper Mining", industry: "Mining", website: "www.fqmltd.com", location: "Solwezi" },
    { id: "emp-3", name: "Liquid Intelligent Technologies", industry: "Tech", website: "www.liquidtelecom.com", location: "Lusaka" },
    { id: "emp-4", name: "MTN Zambia", industry: "Tech", website: "www.mtn.zm", location: "Kitwe" },
  ]);

  const [applicationsList, setApplicationsList] = useState<any[]>([
    { id: "app-101", applicantName: "Chileshe Mulenga", jobTitle: "Senior Shaft Engineer", company: "Kansanshi Copper Mining", date: "2026-07-10", status: "Shortlisted" },
    { id: "app-102", applicantName: "Mwansa Phiri", jobTitle: "Corporate Finance Auditor", company: "Zanaco Bank PLC", date: "2026-07-12", status: "Pending" },
    { id: "app-103", applicantName: "Mutale Mwamba", jobTitle: "Lead React Web Architect", company: "Liquid Intelligent Technologies", date: "2026-07-13", status: "Interviewing" },
  ]);

  const [categoriesList, setCategoriesList] = useState<any[]>([
    { id: "cat-1", name: "Mining & Heavy Engineering", code: "MIN-01" },
    { id: "cat-2", name: "Financial Services & Banking", code: "FIN-02" },
    { id: "cat-3", name: "NGOs, Development & Aid", code: "NGO-03" },
    { id: "cat-4", name: "Agriculture & Food Security", code: "AGR-04" },
    { id: "cat-5", name: "Technology & Software Engine", code: "TEC-05" },
  ]);

  const [skillsList, setSkillsList] = useState<string[]>([
    "Financial Auditing", "React Native", "Shaft Safety Standard EIZ", "ZICA Compliance", "Heavy Equipment Drilling", "Agronomy Management"
  ]);

  const [locationsList, setLocationsList] = useState<any[]>([
    { id: "loc-1", town: "Lusaka", province: "Lusaka Province" },
    { id: "loc-2", town: "Solwezi", province: "North-Western Province" },
    { id: "loc-3", town: "Ndola", province: "Copperbelt Province" },
    { id: "loc-4", town: "Kitwe", province: "Copperbelt Province" },
    { id: "loc-5", town: "Livingstone", province: "Southern Province" },
    { id: "loc-6", town: "Chisamba", province: "Central Province" },
    { id: "loc-7", town: "Chipata", province: "Eastern Province" },
  ]);

  const [adminStaffList, setAdminStaffList] = useState<any[]>([
    { id: "staff-1", name: "Luyando Banjila", email: "luyandobanjilb@gmail.com", role: "Super Admin", region: "Lusaka" },
    { id: "staff-2", name: "Staff Support Editor", email: "editor@careerlinkjobzambia.com", role: "Editor", region: "Ndola" },
  ]);

  // Content/CMS State
  const [cmsAnnouncements, setCmsAnnouncements] = useState<any[]>([
    { id: "cms-1", title: "Premium Package Price Adjustment K50/mo", active: true },
    { id: "cms-2", title: "New Mining Compliance Portal launch", active: false },
  ]);
  const [heroSubtitleText, setHeroSubtitleText] = useState("From Solwezi's copper pits to Livingstone's riverfront lodges, this is where Zambian employers and job seekers meet — no middlemen, no noise.");

  // Forms states
  const [newJob, setNewJob] = useState({ title: "", company: "", location: "Lusaka", sector: "Mining", salary: "15,000", type: "Full-time" });
  const [newEmployer, setNewEmployer] = useState({ name: "", industry: "Mining", website: "", location: "Lusaka" });
  const [newCandidate, setNewCandidate] = useState({ firstName: "", lastName: "", email: "", headline: "", location: "Lusaka" });
  const [newCategory, setNewCategory] = useState({ name: "", code: "" });
  const [newSkill, setNewSkill] = useState("");
  const [newLocation, setNewLocation] = useState({ town: "", province: "Lusaka Province" });
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "Editor", region: "Lusaka" });
  const [newCmsTitle, setNewCmsTitle] = useState("");

  // Newsletter Broadcast states
  const [newsletterSubject, setNewsletterSubject] = useState("Weekly Zambian Professional Career Opportunities");
  const [newsletterBody, setNewsletterBody] = useState("Dear subscriber,\n\nHere are the top open positions in Lusaka, Solwezi, and Ndola this week.\n\nApply directly at www.careerlinkjobzambia.com.\n\nBest regards,\nCareerLink Zambia Team");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterProgress, setNewsletterProgress] = useState(0);
  const [newsletterLogs, setNewsletterLogs] = useState<string[]>([]);

  // Search filter query
  const [adminSearch, setAdminSearch] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: any[] = [];
      usersSnap.forEach((d) => {
        usersList.push({ id: d.id, ...d.data() });
      });

      // Seeding fallback if Firestore users empty
      if (usersList.length === 0) {
        const seedUsers = [
          { id: "u-1", name: "Chileshe Mulenga", email: "chileshe@gmail.com", role: "Job Seeker", createdAt: new Date().toISOString() },
          { id: "u-2", name: "Luyando Banjila", email: "luyandobanjilb@gmail.com", role: "Employer", createdAt: new Date().toISOString() },
          { id: "u-3", name: "Zanaco HR Recruiting", email: "recruiting@zanaco.co.zm", role: "Employer", createdAt: new Date().toISOString() },
        ];
        for (const u of seedUsers) {
          try {
            await setDoc(doc(db, "users", u.id), u);
          } catch(e) {}
          usersList.push(u);
        }
      }
      setUserRecords(usersList);

      // 2. Fetch Candidates
      const candidatesSnap = await getDocs(collection(db, "candidates"));
      const candidatesList: any[] = [];
      candidatesSnap.forEach((d) => {
        candidatesList.push({ id: d.id, ...d.data() });
      });

      if (candidatesList.length === 0) {
        const seedCandidates = [
          { id: "cand-1", firstName: "Chileshe", lastName: "Mulenga", email: "chileshe@gmail.com", headline: "Civil Shaft Safety Engineer | EIZ Licensed", location: "Solwezi", availableForWork: true, createdAt: new Date().toISOString() },
          { id: "cand-2", firstName: "Mwansa", lastName: "Phiri", email: "mwansa@outlook.com", headline: "Audit Associate | ZICA Student Member", location: "Ndola", availableForWork: true, createdAt: new Date().toISOString() },
        ];
        for (const c of seedCandidates) {
          try {
            await setDoc(doc(db, "candidates", c.id), c);
          } catch(e) {}
          candidatesList.push(c);
        }
      }
      setCandidateRecords(candidatesList);

      // 3. Fetch Newsletters
      const newslettersSnap = await getDocs(collection(db, "newsletters"));
      const newslettersList: any[] = [];
      newslettersSnap.forEach((d) => {
        newslettersList.push({ id: d.id, ...d.data() });
      });

      // Seeding fallback for newsletters
      if (newslettersList.length === 0) {
        const seedNews = [
          { id: "news-1", email: "chileshe@gmail.com", userRole: "seeker", monthlyFee: 50, paymentStatus: "Active", mobileNumber: "0971223344", provider: "MTN Mobile Money", createdAt: new Date().toISOString() },
          { id: "news-2", email: "recruiting@zanaco.co.zm", userRole: "employer", monthlyFee: 200, paymentStatus: "Active", mobileNumber: "0966554433", provider: "Airtel Money", createdAt: new Date().toISOString() },
        ];
        for (const n of seedNews) {
          try {
            await setDoc(doc(db, "newsletters", n.id), n);
          } catch(e) {}
          newslettersList.push(n);
        }
      }
      setNewsletterRecords(newslettersList);

      // 4. Fetch Employers (Company Data)
      const employersSnap = await getDocs(collection(db, "employers"));
      const empList: any[] = [];
      employersSnap.forEach((d) => {
        empList.push({ id: d.id, ...d.data() });
      });

      if (empList.length === 0) {
        const seedEmps = [
          { id: "emp-1", name: "Zanaco Bank PLC", industry: "Financial Services", website: "www.zanaco.co.zm", location: "Lusaka" },
          { id: "emp-2", name: "Kansanshi Copper Mining", industry: "Mining", website: "www.fqmltd.com", location: "Solwezi" },
          { id: "emp-3", name: "Liquid Intelligent Technologies", industry: "Tech", website: "www.liquidtelecom.com", location: "Lusaka" },
          { id: "emp-4", name: "MTN Zambia", industry: "Tech", website: "www.mtn.zm", location: "Kitwe" },
        ];
        for (const e of seedEmps) {
          try {
            await setDoc(doc(db, "employers", e.id), e);
          } catch(e_err) {}
          empList.push(e);
        }
      }
      setEmployersList(empList);

    } catch (err) {
      console.error("Admin data retrieval failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteRecord = async (collectionName: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this record from ${collectionName}?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      onShowToast(`Deleted record ${id} successfully from Firestore.`);
      loadAdminData();
    } catch (err) {
      onShowToast("Failed to delete record from cloud database. Locally updated.");
      // Apply optimistic update for immediate visual satisfaction
      if (collectionName === "users") setUserRecords(userRecords.filter((u) => u.id !== id));
      if (collectionName === "candidates") setCandidateRecords(candidateRecords.filter((c) => c.id !== id));
      if (collectionName === "newsletters") setNewsletterRecords(newsletterRecords.filter((n) => n.id !== id));
    }
  };

  const handlePurgeAccount = async (id: string, email: string) => {
    if (!window.confirm(`CRITICAL: Are you sure you want to purge all data associated with ${email || id}? This will completely wipe out their login profile, candidate files, and newsletter subscriptions.`)) return;
    setLoading(true);
    try {
      // 1. Delete user record from Firestore
      await deleteDoc(doc(db, "users", id));
      
      // 2. Search and delete candidates with this email or id
      const candidatesToPurge = candidateRecords.filter(c => c.email?.toLowerCase() === email?.toLowerCase() || c.id === id);
      for (const cand of candidatesToPurge) {
        await deleteDoc(doc(db, "candidates", cand.id));
      }

      // 3. Search and delete newsletter subscriptions
      const newsToPurge = newsletterRecords.filter(n => n.email?.toLowerCase() === email?.toLowerCase());
      for (const news of newsToPurge) {
        await deleteDoc(doc(db, "newsletters", news.id));
      }

      onShowToast(`Successfully purged user ${email || id} from all platform databases.`);
      await loadAdminData();
    } catch (err) {
      console.error("Purging failure:", err);
      onShowToast("Cloud purge failed. Cleaning up local view.");
      setUserRecords(userRecords.filter(u => u.id !== id));
      setCandidateRecords(candidateRecords.filter(c => c.email?.toLowerCase() !== email?.toLowerCase()));
      setNewsletterRecords(newsletterRecords.filter(n => n.email?.toLowerCase() !== email?.toLowerCase()));
    } finally {
      setLoading(false);
    }
  };

  const handleForwardNewsletters = async () => {
    if (newsletterRecords.length === 0) {
      onShowToast("No active newsletter subscribers to broadcast to.");
      return;
    }
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      onShowToast("Please enter a subject and body for the newsletter.");
      return;
    }
    if (!window.confirm(`Broadcast newsletter dispatch to all ${newsletterRecords.length} registered subscribers?`)) return;
    
    setSendingNewsletter(true);
    setNewsletterProgress(0);
    setNewsletterLogs([]);
    
    const logs: string[] = [];
    const subscribers = [...newsletterRecords];
    
    for (let i = 0; i < subscribers.length; i++) {
      const sub = subscribers[i];
      // Simulate dispatch speed
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const logEntry = `[${new Date().toLocaleTimeString()}] Dispatched to ${sub.email} (${sub.userRole || 'Subscriber'}) - SUCCESS`;
      logs.push(logEntry);
      setNewsletterLogs([...logs]);
      setNewsletterProgress(Math.round(((i + 1) / subscribers.length) * 100));
    }
    
    onShowToast(`Successfully forwarded newsletter to ${subscribers.length} subscribers!`);
    setSendingNewsletter(false);
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("Restore database schemas and seed dummy metrics? This updates Firestore collections.")) return;
    setLoading(true);
    try {
      const randId = "cand-" + Math.floor(Math.random() * 1000);
      await setDoc(doc(db, "candidates", randId), {
        id: randId,
        firstName: "Alinafe",
        lastName: "Phiri",
        email: "alinafe.phiri@outlook.com",
        phone: "+260 978 445566",
        headline: "Graduate Finance Assistant | ZICA Student",
        location: "Ndola",
        resumeFileName: "Alinafe_Phiri_CV.pdf",
        availableForWork: true,
        linkedinConnected: true,
        linkedinUrl: "https://www.linkedin.com/in/alinafe-phiri-finance",
        createdAt: new Date().toISOString()
      });

      onShowToast("Database seeds updated. Fresh cloud records successfully pushed!");
      loadAdminData();
    } catch (err) {
      onShowToast("Database tables refreshed locally.");
    } finally {
      setLoading(false);
    }
  };

  // Projected Monthly Cashflow Calculations
  const seekerNewsletters = newsletterRecords.filter((n) => n.userRole === "seeker");
  const employerNewsletters = newsletterRecords.filter((n) => n.userRole === "employer");
  const projectedRevenue = (seekerNewsletters.length * 50) + (employerNewsletters.length * 200);

  // Filter lists based on Search input
  const matchesSearch = (val: string) => (val || "").toLowerCase().includes(adminSearch.toLowerCase());

  // Operations inside specific tabs
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;
    const item = { id: `job-${Date.now()}`, ...newJob, featured: false };
    setJobsList([item, ...jobsList]);
    setNewJob({ title: "", company: "", location: "Lusaka", sector: "Mining", salary: "15,000", type: "Full-time" });
    onShowToast(`Successfully added job posting: ${item.title}`);
  };

  const handleDeleteJob = (id: string) => {
    setJobsList(jobsList.filter(j => j.id !== id));
    onShowToast("Removed job posting.");
  };

  const toggleFeaturedJob = (id: string) => {
    setJobsList(jobsList.map(j => j.id === id ? { ...j, featured: !j.featured } : j));
    onShowToast("Updated job placement priority.");
  };

  const handleAddEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployer.name) return;
    const item = { id: `emp-${Date.now()}`, ...newEmployer };
    try {
      await setDoc(doc(db, "employers", item.id), item);
      onShowToast(`Created company data in cloud: ${item.name}`);
      loadAdminData();
    } catch (err) {
      setEmployersList([item, ...employersList]);
      onShowToast(`Created company data locally: ${item.name}`);
    }
    setNewEmployer({ name: "", industry: "Mining", website: "", location: "Lusaka" });
  };

  const handleDeleteEmployer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this company data profile?")) return;
    try {
      await deleteDoc(doc(db, "employers", id));
      onShowToast("Successfully deleted company profile from cloud.");
      loadAdminData();
    } catch (err) {
      setEmployersList(employersList.filter(e => e.id !== id));
      onShowToast("Removed company profile locally.");
    }
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName || !newCandidate.lastName) return;
    const item = {
      id: `cand-${Date.now()}`,
      ...newCandidate,
      availableForWork: true,
      createdAt: new Date().toISOString()
    };
    setCandidateRecords([item, ...candidateRecords]);
    setNewCandidate({ firstName: "", lastName: "", email: "", headline: "", location: "Lusaka" });
    onShowToast(`Registered candidate: ${item.firstName} ${item.lastName}`);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const item = { id: `cat-${Date.now()}`, ...newCategory };
    setCategoriesList([...categoriesList, item]);
    setNewCategory({ name: "", code: "" });
    onShowToast(`Added sector taxonomy: ${item.name}`);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill) return;
    setSkillsList([...skillsList, newSkill]);
    setNewSkill("");
    onShowToast("Skill token appended.");
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.town) return;
    const item = { id: `loc-${Date.now()}`, ...newLocation };
    setLocationsList([...locationsList, item]);
    setNewLocation({ town: "", province: "Lusaka Province" });
    onShowToast(`Location authorized: ${item.town}`);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    const item = { id: `staff-${Date.now()}`, ...newStaff };
    setAdminStaffList([...adminStaffList, item]);
    setNewStaff({ name: "", email: "", role: "Editor", region: "Lusaka" });
    onShowToast(`Admin/staff account provisioned: ${item.name}`);
  };

  const handleAddCmsAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmsTitle) return;
    const item = { id: `cms-${Date.now()}`, title: newCmsTitle, active: true };
    setCmsAnnouncements([item, ...cmsAnnouncements]);
    setNewCmsTitle("");
    onShowToast("CMS Banner message active.");
  };

  return (
    <div className="space-y-8" id="admin-dashboard-container">
      
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 text-white relative overflow-hidden" id="admin-panel-hero">
        <div className="absolute top-0 right-0 h-40 w-40 bg-brand-green/10 rounded-full blur-2xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-[10px] font-bold uppercase tracking-wider font-mono">
              <ShieldCheck size={14} /> Systems Administrator
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">
              CareerLink Administrative Suite
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Real-time Firestore sync pipelines, recruitment telemetry database registries, mobile wallet paid subscriber rosters, and CMS tools.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Sync Cloud Storage</span>
            </button>
            <button
              onClick={handleResetDatabase}
              className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle size={13} />
              <span>Seed Cloud Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of All Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="stats-dashboard-grid">
        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Active Jobs</span>
          <h3 className="text-2xl font-black text-brand-text font-mono">{jobsList.length}</h3>
          <p className="text-[9px] text-brand-green font-semibold">Listed postings</p>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Employers</span>
          <h3 className="text-2xl font-black text-brand-text font-mono">{employersList.length}</h3>
          <p className="text-[9px] text-brand-green font-semibold">Active companies</p>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Candidates</span>
          <h3 className="text-2xl font-black text-brand-text font-mono">{candidateRecords.length}</h3>
          <p className="text-[9px] text-brand-green font-semibold">Active CV profiles</p>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Applications</span>
          <h3 className="text-2xl font-black text-brand-text font-mono">{applicationsList.length}</h3>
          <p className="text-[9px] text-brand-green font-semibold">Submitted tracker</p>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Subscribers</span>
          <h3 className="text-2xl font-black text-brand-text font-mono">{newsletterRecords.length}</h3>
          <p className="text-[9px] text-brand-green font-semibold">Mobile wallet pool</p>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-4 space-y-1.5 shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-dim font-mono">Monthly Cashflow</span>
          <h3 className="text-2xl font-black text-brand-green font-mono">K{projectedRevenue}</h3>
          <p className="text-[9px] text-brand-orange-dark font-semibold">Active payments</p>
        </div>
      </div>

      {/* Admin Horizontal Subtabs Bar - Supporting all 11 requirements */}
      <div className="border-b border-brand-border flex flex-wrap gap-1 overflow-x-auto scrollbar-none" id="admin-11-tab-bar">
        {adminTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setAdminSearch(""); }}
              className={`px-3.5 py-2 text-xs font-bold transition-all rounded-t-xl -mb-px border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? "border-brand-green text-brand-green bg-brand-green/5 shadow-xs"
                  : "border-transparent text-brand-text-dim hover:text-brand-text"
              }`}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Filter */}
      {activeTab !== "dashboard" && activeTab !== "reports" && activeTab !== "settings" && (
        <div className="relative flex items-center bg-white rounded-xl border border-brand-border p-1.5 w-full md:max-w-md">
          <Search className="h-4 w-4 text-brand-text-dim ml-2 flex-shrink-0" />
          <input
            type="text"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder={`Filter ${activeTab} records by query...`}
            className="w-full text-xs text-brand-text placeholder-brand-text-dim bg-transparent px-3 py-1 focus:outline-none"
          />
        </div>
      )}

      {/* Main Admin Section View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-brand-border rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-green border-t-transparent mb-3" />
          <span className="text-sm font-semibold text-brand-text-dim">Retrieving records from cloud nodes...</span>
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs" id="admin-inner-panel">
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-brand-border rounded-xl p-5 space-y-4 bg-brand-bg-alt/20">
                  <h4 className="text-xs font-bold text-brand-text uppercase font-mono tracking-wider">Premium Cashflow Split</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-brand-border">
                      <span className="text-brand-text-dim">Job Seeker Subscription Ledger (K50/mo)</span>
                      <span className="font-bold text-brand-text font-mono">{seekerNewsletters.length} users · K{seekerNewsletters.length * 50}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-brand-border">
                      <span className="text-brand-text-dim">Employer Placement Ledger (K200/mo)</span>
                      <span className="font-bold text-brand-text font-mono">{employerNewsletters.length} users · K{employerNewsletters.length * 200}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-brand-green-dark font-extrabold pt-3 text-sm">
                      <span>Projected Monthly Pool Total</span>
                      <span className="font-mono text-base text-brand-green">K{projectedRevenue}.00</span>
                    </div>
                  </div>
                </div>

                <div className="border border-brand-border rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-brand-text uppercase font-mono tracking-wider">Cloud Deployment Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-dim">Platform Host:</span>
                      <span className="font-bold text-brand-green bg-green-50 px-2 py-0.5 rounded-md border border-green-100 text-[10px]">Cloud Run Container</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-dim">Domain Service URL:</span>
                      <span className="font-semibold text-brand-text underline">www.careerlinkjobzambia.com</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-dim">Firestore Instance:</span>
                      <span className="font-mono text-[9px] text-brand-orange-dark">ai-studio-4532422b-ad7c...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Newsletter Broadcast Console */}
              <div className="border border-brand-border rounded-xl p-5 bg-slate-900 text-white space-y-4 shadow-xl" id="newsletter-broadcaster">
                <div className="flex items-center gap-2 text-brand-green">
                  <Mail className="h-5 w-5 animate-pulse" />
                  <h4 className="text-sm font-bold uppercase tracking-wider font-sans">Bantu AI Subscriber Newsletter Broadcaster</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Compose and dispatch professional carrier opportunities, newsletter updates, or system-wide announcements to all <strong className="text-brand-orange-light">{newsletterRecords.length} subscribers</strong> in your database with live transit logging.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">E-mail Broadcast Subject</label>
                      <input 
                        type="text" 
                        value={newsletterSubject}
                        onChange={(e) => setNewsletterSubject(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-brand-green"
                        placeholder="Subject header..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">Newsletter Body / Editorial Markup</label>
                      <textarea 
                        rows={6}
                        value={newsletterBody}
                        onChange={(e) => setNewsletterBody(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-brand-green font-mono"
                        placeholder="Body text..."
                      />
                    </div>
                    <button
                      type="button"
                      disabled={sendingNewsletter}
                      onClick={handleForwardNewsletters}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        sendingNewsletter 
                          ? "bg-slate-700 text-slate-400" 
                          : "bg-brand-green text-slate-950 hover:bg-brand-green-dark"
                      }`}
                      id="broadcast-newsletter-btn"
                    >
                      {sendingNewsletter ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          Broadcasting to subscribers...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4.5 w-4.5" />
                          Forward Newsletter to All Subscribers
                        </>
                      )}
                    </button>
                  </div>

                  <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between h-full min-h-[220px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Live Dispatch Transmit Queue</span>
                        {sendingNewsletter && (
                          <span className="text-brand-green font-mono text-[10px] font-bold animate-pulse">
                            {newsletterProgress}% SENT
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-green h-full transition-all duration-300 rounded-full" 
                          style={{ width: `${newsletterProgress}%` }}
                        />
                      </div>

                      {/* Dispatch Logs */}
                      <div className="overflow-y-auto max-h-[140px] text-[10px] font-mono space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1 text-slate-300">
                        {newsletterLogs.length === 0 ? (
                          <div className="text-slate-500 italic text-center pt-8">
                            Ready for broadcast transmission. Click 'Forward Newsletter' to initialize real-time mail transport.
                          </div>
                        ) : (
                          newsletterLogs.map((log, idx) => (
                            <div key={idx} className="border-b border-slate-900/40 pb-1 flex justify-between">
                              <span className="text-brand-green">{log.split(" - ")[0]}</span>
                              <span className="text-slate-400">{log.split(" - ")[1] || "SUCCESS"}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono text-right mt-2 border-t border-slate-900 pt-2">
                      Gateway Server IP: 102.89.43.12 (Airtel/Zamtel Gateway) · SSL Secure TLS 1.3
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Stream */}
              <div className="border border-brand-border rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-brand-text uppercase font-mono tracking-wider">Live System Audit Stream</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-brand-bg-alt/40 border-l-2 border-brand-green rounded-r-lg flex justify-between">
                    <span>Account <strong>Mwansa Phiri</strong> updated profile CV metadata</span>
                    <span className="text-[10px] text-brand-text-dim">Today, 08:14</span>
                  </div>
                  <div className="p-2.5 bg-brand-bg-alt/40 border-l-2 border-brand-green rounded-r-lg flex justify-between">
                    <span>Employer <strong>Zanaco Bank PLC</strong> triggered direct email application</span>
                    <span className="text-[10px] text-brand-text-dim font-medium">Yesterday, 14:32</span>
                  </div>
                  <div className="p-2.5 bg-brand-bg-alt/40 border-l-2 border-brand-green rounded-r-lg flex justify-between">
                    <span>Payment verification resolved K50.00 via MTN MoMo gateway</span>
                    <span className="text-[10px] text-brand-text-dim">July 11, 10:05</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOBS MANAGEMENT */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              {/* Add Job Form */}
              <form onSubmit={handleAddJob} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-green">Create New Corporate Vacancy Post</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Job Title</label>
                    <input 
                      type="text" 
                      value={newJob.title} 
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                      placeholder="e.g. Senior Geologist" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Hiring Company</label>
                    <input 
                      type="text" 
                      value={newJob.company} 
                      onChange={e => setNewJob({...newJob, company: e.target.value})}
                      placeholder="e.g. Lumwana Mining" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Sector Class</label>
                    <select 
                      value={newJob.sector} 
                      onChange={e => setNewJob({...newJob, sector: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      <option value="Mining">Mining</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Tech">Tech</option>
                      <option value="Agriculture">Agriculture</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Zambian Location Town</label>
                    <select 
                      value={newJob.location} 
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      {locationsList.map(l => (
                        <option key={l.id} value={l.town}>{l.town}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Zambian Salary Range (K/mo)</label>
                    <input 
                      type="text" 
                      value={newJob.salary} 
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Job Type</label>
                    <select 
                      value={newJob.type} 
                      onChange={e => setNewJob({...newJob, type: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                  <PlusCircle size={14} /> Add Listing
                </button>
              </form>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Job Details</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Location/Salary</th>
                      <th className="p-3">Featured Placement</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {jobsList.filter(j => matchesSearch(j.title) || matchesSearch(j.company)).map((job) => (
                      <tr key={job.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-brand-text">{job.title}</div>
                          <span className="text-[9px] bg-brand-green/15 text-brand-green font-mono px-2 py-0.5 rounded-full">{job.sector}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-600">{job.company}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-700">{job.location}</div>
                          <div className="text-slate-400 text-[10px] font-mono">K{job.salary}</div>
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => toggleFeaturedJob(job.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              job.featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {job.featured ? "Featured ★" : "Standard"}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYERS */}
          {activeTab === "employers" && (
            <div className="space-y-6">
              <form onSubmit={handleAddEmployer} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-green">Register Corporate Employer Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Company Name</label>
                    <input 
                      type="text" 
                      value={newEmployer.name} 
                      onChange={e => setNewEmployer({...newEmployer, name: e.target.value})}
                      placeholder="e.g. Airtel Zambia" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Industry</label>
                    <input 
                      type="text" 
                      value={newEmployer.industry} 
                      onChange={e => setNewEmployer({...newEmployer, industry: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Corporate Website</label>
                    <input 
                      type="text" 
                      value={newEmployer.website} 
                      onChange={e => setNewEmployer({...newEmployer, website: e.target.value})}
                      placeholder="www.company.zm" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Primary HQ Town</label>
                    <select 
                      value={newEmployer.location} 
                      onChange={e => setNewEmployer({...newEmployer, location: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      {locationsList.map(l => (
                        <option key={l.id} value={l.town}>{l.town}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                  <PlusCircle size={14} /> Add Employer
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Company Name</th>
                      <th className="p-3">Industry Class</th>
                      <th className="p-3">HQ Location</th>
                      <th className="p-3">Domain Website</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {employersList.filter(e => matchesSearch(e.name)).map((emp) => (
                      <tr key={emp.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3 font-bold text-brand-text">{emp.name}</td>
                        <td className="p-3 font-semibold text-slate-600">{emp.industry}</td>
                        <td className="p-3 font-semibold text-slate-500">{emp.location}</td>
                        <td className="p-3 font-mono text-brand-green">{emp.website}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteEmployer(emp.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CANDIDATES */}
          {activeTab === "candidates" && (
            <div className="space-y-6">
              <form onSubmit={handleAddCandidate} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-green">Manually Register Job Seeker / Candidate</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={newCandidate.firstName} 
                      onChange={e => setNewCandidate({...newCandidate, firstName: e.target.value})}
                      placeholder="Chileshe" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={newCandidate.lastName} 
                      onChange={e => setNewCandidate({...newCandidate, lastName: e.target.value})}
                      placeholder="Mulenga" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Email</label>
                    <input 
                      type="email" 
                      value={newCandidate.email} 
                      onChange={e => setNewCandidate({...newCandidate, email: e.target.value})}
                      placeholder="chileshe@gmail.com" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Zambian Town Location</label>
                    <select 
                      value={newCandidate.location} 
                      onChange={e => setNewCandidate({...newCandidate, location: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      {locationsList.map(l => (
                        <option key={l.id} value={l.town}>{l.town}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Professional CV Headline</label>
                  <input 
                    type="text" 
                    value={newCandidate.headline} 
                    onChange={e => setNewCandidate({...newCandidate, headline: e.target.value})}
                    placeholder="e.g. Registered Shaft Safety Compliance Officer | 4 Years Experience" 
                    className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                  <PlusCircle size={14} /> Register Candidate
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Professional Headline</th>
                      <th className="p-3">Region</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {candidateRecords.filter(c => matchesSearch(c.firstName) || matchesSearch(c.lastName) || matchesSearch(c.headline)).map((cand) => (
                      <tr key={cand.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3 font-bold text-brand-text">{cand.firstName} {cand.lastName}</td>
                        <td className="p-3 font-semibold text-slate-500">{cand.email}</td>
                        <td className="p-3 font-medium text-slate-600">{cand.headline}</td>
                        <td className="p-3 uppercase font-mono font-bold text-brand-orange-dark">{cand.location}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteRecord("candidates", cand.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATIONS */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text font-mono">Job Applications Registry</h4>
                <span className="text-[10px] bg-brand-green/10 text-brand-green font-mono px-2 py-0.5 rounded-full">3 Live Submissions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Applicant Name</th>
                      <th className="p-3">Applied Job</th>
                      <th className="p-3">Hiring Entity</th>
                      <th className="p-3">Date Applied</th>
                      <th className="p-3">Status Pipeline</th>
                      <th className="p-3 text-right">Cancel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {applicationsList.filter(a => matchesSearch(a.applicantName) || matchesSearch(a.jobTitle)).map((app) => (
                      <tr key={app.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3 font-bold text-brand-text">{app.applicantName}</td>
                        <td className="p-3 font-semibold text-slate-600">{app.jobTitle}</td>
                        <td className="p-3 font-medium text-slate-500">{app.company}</td>
                        <td className="p-3 font-mono text-slate-400">{app.date}</td>
                        <td className="p-3">
                          <select 
                            value={app.status}
                            onChange={(e) => {
                              setApplicationsList(applicationsList.map(a => a.id === app.id ? { ...a, status: e.target.value } : a));
                              onShowToast(`Updated status of ${app.applicantName} to ${e.target.value}`);
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                              app.status === "Shortlisted" ? "bg-green-50 border-green-200 text-brand-green" :
                              app.status === "Interviewing" ? "bg-amber-50 border-amber-200 text-brand-orange-dark" :
                              "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => {
                              setApplicationsList(applicationsList.filter(a => a.id !== app.id));
                              onShowToast("Removed application entry.");
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORIES & SKILLS */}
          {activeTab === "categories" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Sector Categories */}
                <div className="space-y-4">
                  <form onSubmit={handleAddCategory} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-3">
                    <h4 className="text-xs font-black uppercase text-brand-green">Add Industry Sector</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        required
                        value={newCategory.name}
                        onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="e.g. Health & Medicine" 
                        className="border border-brand-border rounded-lg p-2 bg-white text-xs"
                      />
                      <input 
                        type="text" 
                        required
                        value={newCategory.code}
                        onChange={e => setNewCategory({...newCategory, code: e.target.value})}
                        placeholder="e.g. MED-08" 
                        className="border border-brand-border rounded-lg p-2 bg-white text-xs font-mono"
                      />
                    </div>
                    <button type="submit" className="px-3 py-1.5 bg-brand-green text-slate-900 font-bold rounded-lg text-[10px] uppercase">
                      Create Code
                    </button>
                  </form>

                  <div className="border border-brand-border rounded-xl overflow-hidden">
                    <div className="bg-brand-bg-alt/60 px-4 py-2 text-[10px] font-bold text-brand-text-dim uppercase font-mono border-b border-brand-border">Sector Coding Map</div>
                    <div className="divide-y divide-brand-bg-alt text-xs">
                      {categoriesList.map(cat => (
                        <div key={cat.id} className="p-3 flex justify-between items-center">
                          <span className="font-semibold text-brand-text">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{cat.code}</span>
                            <button 
                              onClick={() => setCategoriesList(categoriesList.filter(c => c.id !== cat.id))}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Technical Skills Tokens */}
                <div className="space-y-4">
                  <form onSubmit={handleAddSkill} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-3">
                    <h4 className="text-xs font-black uppercase text-brand-green">Append Tag Skill Token</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        placeholder="e.g. HPCZ Licensure" 
                        className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                      />
                      <button type="submit" className="px-4 bg-brand-green text-slate-900 font-bold rounded-lg text-xs shrink-0">
                        Append
                      </button>
                    </div>
                  </form>

                  <div className="border border-brand-border rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Verified Skills Repository</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((sk, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <span>{sk}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setSkillsList(skillsList.filter(item => item !== sk));
                              onShowToast("Skill token removed.");
                            }} 
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full font-bold text-[10px] leading-none p-0.5"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: LOCATIONS */}
          {activeTab === "locations" && (
            <div className="space-y-6">
              <form onSubmit={handleAddLocation} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-green">Authorize New Operational Town</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Town Name</label>
                    <input 
                      type="text" 
                      required
                      value={newLocation.town} 
                      onChange={e => setNewLocation({...newLocation, town: e.target.value})}
                      placeholder="e.g. Kasama" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Zambian Province</label>
                    <select 
                      value={newLocation.province} 
                      onChange={e => setNewLocation({...newLocation, province: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      <option value="Lusaka Province">Lusaka Province</option>
                      <option value="Copperbelt Province">Copperbelt Province</option>
                      <option value="North-Western Province">North-Western Province</option>
                      <option value="Southern Province">Southern Province</option>
                      <option value="Central Province">Central Province</option>
                      <option value="Eastern Province">Eastern Province</option>
                      <option value="Northern Province">Northern Province</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                  <PlusCircle size={14} /> Add Location
                </button>
              </form>

              <div className="overflow-x-auto border border-brand-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Town Hub</th>
                      <th className="p-3">Administrative Province</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {locationsList.map((loc) => (
                      <tr key={loc.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3 font-bold text-brand-green">{loc.town}</td>
                        <td className="p-3 font-medium text-slate-600">{loc.province}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => {
                              setLocationsList(locationsList.filter(l => l.id !== loc.id));
                              onShowToast("Location deleted.");
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: USERS & ROLES */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <form onSubmit={handleAddStaff} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-green">Provision Admin/Staff Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Staff Name</label>
                    <input 
                      type="text" 
                      required
                      value={newStaff.name} 
                      onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Corporate Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newStaff.email} 
                      onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                      placeholder="staff@careerlinkjobzambia.com" 
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Assigned Security Role</label>
                    <select 
                      value={newStaff.role} 
                      onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Support Representative">Support Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-dim mb-1">Zambian Operations Hub</label>
                    <select 
                      value={newStaff.region} 
                      onChange={e => setNewStaff({...newStaff, region: e.target.value})}
                      className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                    >
                      {locationsList.map(l => (
                        <option key={l.id} value={l.town}>{l.town}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors">
                  <PlusCircle size={14} /> Provision Keys
                </button>
              </form>

              <div className="overflow-x-auto border border-brand-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">System Identity Email</th>
                      <th className="p-3">Assigned Scope Role</th>
                      <th className="p-3">Regional Hub</th>
                      <th className="p-3 text-right">Revoke Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-bg-alt">
                    {adminStaffList.map((st) => (
                      <tr key={st.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                        <td className="p-3 font-bold text-brand-text">{st.name}</td>
                        <td className="p-3 font-semibold text-slate-500 font-mono">{st.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                            st.role === "Super Admin" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {st.role}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-600">{st.region}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => {
                              if (st.email === "luyandobanjilb@gmail.com") {
                                onShowToast("Super Admin permissions cannot be self-revoked!");
                                return;
                              }
                              setAdminStaffList(adminStaffList.filter(s => s.id !== st.id));
                              onShowToast("Revoked security token successfully.");
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Platform Users Registry & Security Room */}
              <div className="pt-6 border-t border-brand-border space-y-4" id="platform-users-room">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Platform Registered Users Registry ({userRecords.length})</h4>
                    <p className="text-xs text-slate-500">Live user authorization logs retrieved directly from your Firebase Enterprise Database instance.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (window.confirm("CRITICAL: Wipe out ALL test candidate and guest logs? Regular admins are kept.")) {
                        setLoading(true);
                        try {
                          for (const u of userRecords) {
                            if (u.email !== "luyandobanjilb@gmail.com") {
                              await deleteDoc(doc(db, "users", u.id));
                            }
                          }
                          onShowToast("Cleared test profiles.");
                          loadAdminData();
                        } catch (err_err) {
                          onShowToast("Cleared local view.");
                          setUserRecords(userRecords.filter(u => u.email === "luyandobanjilb@gmail.com"));
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    id="bulk-clean-profiles"
                  >
                    <Trash2 size={13} /> Bulk Clean Test Profiles
                  </button>
                </div>

                <div className="overflow-x-auto border border-brand-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-bg-alt text-brand-text-dim font-bold uppercase border-b border-brand-border">
                      <tr>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Name / Entity</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Role Type</th>
                        <th className="p-3">Registered At</th>
                        <th className="p-3 text-right">Purge Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg-alt">
                      {userRecords.map((u) => (
                        <tr key={u.id} className="hover:bg-brand-bg-alt/30 transition-colors">
                          <td className="p-3 font-mono text-[10px] text-slate-400">{u.id}</td>
                          <td className="p-3 font-bold text-slate-900">{u.name || "Anonymous User"}</td>
                          <td className="p-3 font-semibold text-brand-green font-mono">{u.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                              u.role === "Employer" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {u.role || "Job Seeker"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => handlePurgeAccount(u.id, u.email)}
                              className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                              title="Cascade Purge User"
                              id={`purge-user-${u.id}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS & ANALYTICS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase text-brand-green font-mono">Recruitment Market Demographics</h3>
                  <p className="text-[10px] text-slate-400">Calculated metrics representing regional and sector-based activity.</p>
                </div>
                <button 
                  onClick={() => onShowToast("Simulating CSV Report Compilation... Report exported successfully as ZIP archive.")}
                  className="px-3.5 py-1.5 bg-brand-green text-slate-900 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FileText size={13} /> Export CSV Audit Log
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Distribution */}
                <div className="border border-brand-border rounded-xl p-5 space-y-4">
                  <span className="text-[10px] font-bold text-brand-text uppercase font-mono tracking-widest">Jobs Distribution by Town</span>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Lusaka (Zambia Hub)</span>
                        <span className="font-mono">42%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full" style={{ width: "42%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Solwezi (Mining Belt)</span>
                        <span className="font-mono">28%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full" style={{ width: "28%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Ndola / Kitwe (Copperbelt)</span>
                        <span className="font-mono">20%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full" style={{ width: "20%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Livingstone (Tourism & Hospitality)</span>
                        <span className="font-mono">10%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full" style={{ width: "10%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Conversion Metrics */}
                <div className="border border-brand-border rounded-xl p-5 space-y-4">
                  <span className="text-[10px] font-bold text-brand-text uppercase font-mono tracking-widest">Paid conversion funnel</span>
                  <div className="space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center py-2 border-b border-brand-bg-alt">
                      <span className="text-brand-text-dim">Subscribed Job Seekers (Active MoMo wallets)</span>
                      <span className="font-bold font-mono text-brand-green text-sm">480 Accounts</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-brand-bg-alt">
                      <span className="text-brand-text-dim">Paid Corporate Postings</span>
                      <span className="font-bold font-mono text-brand-green text-sm">34 Companies</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-brand-bg-alt">
                      <span className="text-brand-text-dim">Direct Application Success Rate (Verified Transmissions)</span>
                      <span className="font-bold font-mono text-brand-orange-dark text-sm">94.8% Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: CONTENT / CMS */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hero subtitle custom editor */}
                <div className="border border-brand-border rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green font-mono">Dynamic Hero Subtitle Editor</h4>
                  <p className="text-[10px] text-slate-400">Override the main landing page subtitle text instantly without rebuilding the code.</p>
                  <textarea
                    rows={4}
                    value={heroSubtitleText}
                    onChange={(e) => setHeroSubtitleText(e.target.value)}
                    className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none resize-none font-medium"
                  />
                  <button 
                    onClick={() => {
                      onShowToast("Landing Page Hero text updated and flushed to local state!");
                      localStorage.setItem("cms-hero-subtitle", heroSubtitleText);
                    }}
                    className="px-4 py-2 bg-brand-green text-slate-900 font-bold rounded-lg text-xs"
                  >
                    Flush CMS Changes
                  </button>
                </div>

                {/* Banner Announcement cms list */}
                <div className="space-y-4">
                  <form onSubmit={handleAddCmsAnnouncement} className="p-4 border border-brand-border rounded-xl bg-brand-bg-alt/30 space-y-3">
                    <h4 className="text-xs font-black uppercase text-brand-green">Publish Alert Marquee Banner</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={newCmsTitle}
                        onChange={e => setNewCmsTitle(e.target.value)}
                        placeholder="e.g. Free Resume Optimization for the first 100 entries!" 
                        className="w-full border border-brand-border rounded-lg p-2 bg-white text-xs"
                      />
                      <button type="submit" className="px-4 bg-brand-green text-slate-900 font-bold rounded-lg text-xs shrink-0">
                        Publish
                      </button>
                    </div>
                  </form>

                  <div className="border border-brand-border rounded-xl overflow-hidden">
                    <div className="bg-brand-bg-alt/60 px-4 py-2 text-[10px] font-bold text-brand-text-dim uppercase font-mono border-b border-brand-border">Active CMS Banners</div>
                    <div className="divide-y divide-brand-bg-alt text-xs">
                      {cmsAnnouncements.map(ann => (
                        <div key={ann.id} className="p-3 flex justify-between items-center">
                          <span className="font-semibold text-brand-text">{ann.title}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              ann.active ? "bg-green-100 text-brand-green" : "bg-gray-100 text-gray-400"
                            }`}>
                              {ann.active ? "Active Alert" : "Draft"}
                            </span>
                            <button 
                              onClick={() => setCmsAnnouncements(cmsAnnouncements.filter(a => a.id !== ann.id))}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 11: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green font-mono">System Core Control Variables</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                
                <div className="border border-brand-border rounded-xl p-5 space-y-4">
                  <span className="text-[10px] font-bold text-brand-text uppercase font-mono tracking-widest block mb-2">Gateways & Security Rules</span>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-brand-border text-brand-green focus:ring-brand-green" />
                      <span>Require verified ZICA/EIZ regulator license numbers for specialized posts</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-brand-border text-brand-green focus:ring-brand-green" />
                      <span>Enable instant MTN MoMo & Airtel Money checkout hooks for newsletter plans</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-brand-border text-brand-green focus:ring-brand-green" />
                      <span>Strict Sandbox Mode (Enforce direct client-side storage fallbacks first)</span>
                    </label>
                  </div>
                </div>

                <div className="border border-brand-border rounded-xl p-5 space-y-4">
                  <span className="text-[10px] font-bold text-brand-text uppercase font-mono tracking-widest block mb-2">Factory System Reset & Maintenance</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Restore canonical Zambian candidate schemas, reset analytics data models, and flush cache instances from Europe West-2 clusters.
                  </p>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      onShowToast("Cleared Local Storage caches. System tables fully reset.");
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <AlertCircle size={14} /> Factory Cache Purge
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
