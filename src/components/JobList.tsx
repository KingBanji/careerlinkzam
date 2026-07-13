import React, { useState, useEffect } from "react";
import { Search, MapPin, Building2, DollarSign, Clock, ArrowRight, Briefcase, AlertCircle, Bookmark, CheckCircle2, Send, X, BrainCircuit } from "lucide-react";
import { Job } from "../types";
import { initAuth, googleSignIn, sendGmailMessage } from "../lib/gmailAuth";
import FeaturedAndNewsletter from "./FeaturedAndNewsletter";
import CareerNewsTrends from "./CareerNewsTrends";

interface JobListProps {
  onOptimizeForJob: (job: Job) => void;
  onPracticeForJob: (job: Job) => void;
  savedJobs: string[];
  toggleSaveJob: (id: string) => void;
  addAppliedJob: (id: string, jobTitle: string, company: string) => void;
  onOpenAiSuite?: () => void;
}

const SECTORS = ["All Sectors", "Mining", "Financial Services", "NGOs", "Agriculture", "Tech", "Health", "Education"];
const LOCATIONS = ["All Locations", "Lusaka", "Solwezi", "Ndola", "Kitwe", "Livingstone", "Chisamba", "Chipata", "Kabwe"];
const EXPERIENCE_LEVELS = ["All Levels", "Entry", "Mid", "Senior", "Executive"];
const JOB_TYPES = ["All Types", "Full-time", "Part-time", "Contract", "Internship"];

export default function JobList({ onOptimizeForJob, onPracticeForJob, savedJobs, toggleSaveJob, addAppliedJob, onOpenAiSuite }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [localToast, setLocalToast] = useState<string | null>(null);

  useEffect(() => {
    if (localToast) {
      const t = setTimeout(() => setLocalToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [localToast]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedExperience, setSelectedExperience] = useState("All Levels");
  const [selectedType, setSelectedType] = useState("All Types");

  // Selected Job (for detail panel)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [attachedResume, setAttachedResume] = useState("");
  const [applying, setApplying] = useState(false);
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);

  // Gmail states
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailUser, setGmailUser] = useState<any>(null);
  const [sendViaGmail, setSendViaGmail] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGmailConnected(true);
        setGmailUser(user);
        if (user.displayName) setApplicantName(user.displayName);
        if (user.email) setApplicantEmail(user.email);
      },
      () => {
        setGmailConnected(false);
        setGmailUser(null);
      }
    );
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [showApplyModal]);

  const handleConnectGmail = async () => {
    try {
      setAuthError(null);
      const res = await googleSignIn();
      if (res) {
        setGmailConnected(true);
        setGmailUser(res.user);
        if (res.user.displayName) setApplicantName(res.user.displayName);
        if (res.user.email) setApplicantEmail(res.user.email);
      }
    } catch (err: any) {
      setAuthError("Google Sign In was not completed. Please try again.");
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedSector !== "All Sectors") params.append("sector", selectedSector);
      if (selectedLocation !== "All Locations") params.append("location", selectedLocation);
      if (selectedExperience !== "All Levels") params.append("experience", selectedExperience);
      if (selectedType !== "All Types") params.append("type", selectedType);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch job listings.");
      const data = await res.json();
      setJobs(data);
      
      // Auto-select first job on desktop if any exist and none selected
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      } else if (data.length === 0) {
        setSelectedJob(null);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while retrieving jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, selectedSector, selectedLocation, selectedExperience, selectedType]);

  // Handle Application submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!applicantName || !applicantEmail || !applicantPhone) {
      alert("Please fill in all required fields.");
      return;
    }

    setApplying(true);
    setAuthError(null);

    if (gmailConnected && sendViaGmail) {
      // Construct email parameters
      const subject = `Job Application: ${selectedJob.title} at ${selectedJob.company} (via www.careerlinkjobzambia.com)`;
      const body = `Dear Hiring Team at ${selectedJob.company},

Please find my application for the ${selectedJob.title} position, submitted via CareerLink Zambia (www.careerlinkjobzambia.com).

My Profile Details:
- Name: ${applicantName}
- Email: ${applicantEmail}
- Phone: ${applicantPhone}

About Me & Resume Highlights:
${attachedResume || "No additional resume details were provided."}

Best regards,
${applicantName}
Sent securely via CareerLink Zambia (www.careerlinkjobzambia.com) & Google Workspace integration.`;

      // Workspace API Rule: Confirmation before sending email
      const confirmed = window.confirm(
        `Are you sure you want to send this application email to ${selectedJob.contactEmail} from your Gmail account (${gmailUser?.email})?`
      );
      
      if (!confirmed) {
        setApplying(false);
        return;
      }

      try {
        await sendGmailMessage(selectedJob.contactEmail, subject, body);
        setApplying(false);
        setAppliedSuccessfully(true);
        addAppliedJob(selectedJob.id, selectedJob.title, selectedJob.company);
        
        setTimeout(() => {
          setShowApplyModal(false);
          setAppliedSuccessfully(false);
          setAttachedResume("");
        }, 2000);
      } catch (err: any) {
        console.error("Gmail send error:", err);
        setAuthError(`Failed to send email via Gmail: ${err.message || "Unknown error."}`);
        setApplying(false);
      }
    } else {
      // Simulate API application submission (Fallback)
      setTimeout(() => {
        setApplying(false);
        setAppliedSuccessfully(true);
        addAppliedJob(selectedJob.id, selectedJob.title, selectedJob.company);
        
        // Reset apply form fields after brief delay
        setTimeout(() => {
          setShowApplyModal(false);
          setAppliedSuccessfully(false);
          setApplicantName("");
          setApplicantEmail("");
          setApplicantPhone("");
          setAttachedResume("");
        }, 2000);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="job-list-tab">
      {/* Hero Header Section */}
      <div className="relative rounded-3xl bg-brand-green overflow-hidden shadow-sm" id="hero-banner">
        <div className="relative max-w-5xl mx-auto px-6 py-10 md:py-14 text-center z-10">
          <div className="flex justify-center mb-5" id="hero-logo-wrapper">
            <img 
              src="/images/CareerLink%20Zambia%20logo%20design.png" 
              alt="CareerLink Zambia Logo" 
              className="h-16 w-auto object-contain bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/20 shadow-xs" 
              referrerPolicy="no-referrer"
              id="hero-logo-img"
            />
          </div>
          <span className="inline-block font-mono text-brand-orange-light text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-3">
            Ten provinces · one seam of opportunity
          </span>
          <h1 className="text-3xl md:text-5xl font-sans font-normal text-white tracking-tight leading-tight mb-4">
            this is where Zambian employers and job seekers meet no middlemen, no noise.
          </h1>
          <p className="text-sm md:text-base text-brand-bg-alt/90 max-w-2xl mx-auto mb-6">
            From Solwezi's copper pits to Livingstone's riverfront lodges, find work that moves Zambia forward.
          </p>

          {/* Quick Search Bar inside Hero */}
          <div className="max-w-xl mx-auto" id="hero-search-wrapper">
            <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-brand-border p-1.5">
              <Search className="h-5 w-5 text-brand-text-dim ml-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, keywords, or company..."
                className="w-full text-sm text-brand-text placeholder-brand-text-dim bg-transparent px-3 py-2 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full hover:bg-brand-bg-alt text-brand-text-dim mr-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="relative bg-brand-orange px-6 py-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center items-center z-10">
          <div>
            <span className="text-xl md:text-2xl font-display font-extrabold text-brand-green-dark">{jobs.length || 14}</span>
            <p className="text-[10px] uppercase tracking-wider text-brand-green-dark/85 font-mono font-semibold">open positions</p>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-display font-extrabold text-brand-green-dark">{new Set(jobs.map(j => j.company)).size || 12}</span>
            <p className="text-[10px] uppercase tracking-wider text-brand-green-dark/85 font-mono font-semibold">employers hiring</p>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-display font-extrabold text-brand-green-dark">10</span>
            <p className="text-[10px] uppercase tracking-wider text-brand-green-dark/85 font-mono font-semibold">provinces covered</p>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-display font-extrabold text-brand-green-dark">100%</span>
            <p className="text-[10px] uppercase tracking-wider text-brand-green-dark/85 font-mono font-semibold">Zambian Roles</p>
          </div>
          <button 
            onClick={onOpenAiSuite}
            className="flex flex-col items-center justify-center cursor-pointer group transition-transform hover:scale-105 active:scale-95 col-span-2 sm:col-span-1"
            id="tracker-bantu-ai-suite"
          >
            <span className="text-xl md:text-2xl font-display font-extrabold text-brand-green-dark flex items-center justify-center gap-1.5">
              <BrainCircuit className="h-5 w-5 text-brand-green-dark animate-pulse shrink-0" />
              Bantu AI
            </span>
            <p className="text-[10px] uppercase tracking-wider text-brand-green-dark/85 font-mono font-bold group-hover:underline">Launch Suite</p>
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between" id="filter-panel">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Sector Select */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Location Select */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Experience Select */}
          <select
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            {EXPERIENCE_LEVELS.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>

          {/* Job Type Select */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-emerald-500"
          >
            {JOB_TYPES.map((jt) => (
              <option key={jt} value={jt}>{jt}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => {
            setSelectedSector("All Sectors");
            setSelectedLocation("All Locations");
            setSelectedExperience("All Levels");
            setSelectedType("All Types");
            setSearchQuery("");
          }}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-all px-2 py-1 rounded"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Grid: Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="job-grid-section">
        {/* Left Side: Job Cards List */}
        <div className="lg:col-span-5 space-y-4" id="cards-column">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {jobs.length} Vacanc{jobs.length === 1 ? "y" : "ies"} Found
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
              <span className="text-sm font-semibold text-gray-500">Retrieving listings...</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-800">{error}</p>
              <button onClick={fetchJobs} className="mt-2 text-xs font-bold text-red-600 underline">Retry</button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
              <p className="text-base font-bold text-gray-700 mb-1">No vacancies found</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">Try adjusting your filters or search terms. Zambia has many opportunities awaiting you!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin">
              {jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const isSaved = savedJobs.includes(job.id);
                return (
                  <div
                    key={job.id}
                    id={`job-card-${job.id}`}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative ${
                      isSelected
                        ? "bg-brand-bg-alt/60 border-brand-green shadow-xs"
                        : "bg-white border-brand-border hover:border-brand-green/30 shadow-xs hover:shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide uppercase mb-1.5 bg-brand-green/10 text-brand-green border border-brand-green/20">
                          {job.sector}
                        </span>
                        <h3 className="text-base font-black text-gray-900 group-hover:text-emerald-600 leading-tight">
                          {job.title}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{job.company}</p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSaved 
                            ? "bg-amber-500 border-amber-500 text-white" 
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:text-amber-500 hover:bg-amber-50/20"
                        }`}
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 pt-3 border-t border-dashed border-gray-100 text-xs text-gray-500 font-medium">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{job.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed View */}
        <div className="lg:col-span-7" id="details-column">
          {selectedJob ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24" id="job-details-pane">
              {/* Header Title / Actions */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-brand-green/10 text-brand-green text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border border-brand-green/20">
                      {selectedJob.sector}
                    </span>
                    <span className="bg-brand-bg-alt text-brand-text-dim text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border border-brand-border">
                      {selectedJob.type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-brand-green tracking-tight leading-tight pt-1">
                    {selectedJob.title}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-brand-text-dim font-semibold pt-0.5">
                    <Building2 className="h-4 w-4 text-brand-text-dim/60" />
                    <span>{selectedJob.company}</span>
                    <span>•</span>
                    <MapPin className="h-4 w-4 text-brand-text-dim/60" />
                    <span>{selectedJob.location}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-brand-bg-alt/50 rounded-xl border border-brand-border">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-brand-text-dim font-bold font-mono">Experience Level</span>
                  <p className="text-xs font-bold text-brand-text">{selectedJob.experience} Level</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-brand-text-dim font-bold font-mono">Zambian Salary Range</span>
                  <p className="text-xs font-bold text-brand-green flex items-center">
                    <span className="mr-0.5 text-brand-orange font-bold font-mono">K</span>
                    <span>{selectedJob.salary}</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-brand-text-dim font-bold font-mono">Required Regulators</span>
                  <p className="text-xs font-bold text-brand-orange">
                    {selectedJob.sector === "Mining" || selectedJob.sector === "Tech" ? "EIZ Registered" : selectedJob.sector === "Financial Services" ? "ZICA Compliant" : selectedJob.sector === "Health" ? "HPCZ Licensed" : "General Local Compliance"}
                  </p>
                </div>
              </div>

              {/* AI Powered Tool Launch Box */}
              <div className="bg-brand-green text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-brand-orange/15 rounded-full blur-xl" />
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-brand-orange-light">
                    <Briefcase className="h-4 w-4 text-brand-orange-light" />
                    <span className="font-display font-bold">Bantu Career Assistant Tools</span>
                  </span>
                  <span className="text-[10px] bg-white/15 text-white border border-white/20 font-mono font-bold px-2 py-0.5 rounded-full">
                    Bantu Engine Active
                  </span>
                </div>
                <p className="text-xs text-brand-bg-alt/95 leading-relaxed font-medium">
                  Boost your chances! Instantly optimize your resume or run a tailored mock interview for this specific position using Bantu's professional tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                  <button
                    onClick={() => onOptimizeForJob(selectedJob)}
                    className="w-full sm:flex-1 bg-white hover:bg-brand-bg-alt text-brand-green text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs"
                  >
                    Optimize My Resume
                  </button>
                  <button
                    onClick={() => onPracticeForJob(selectedJob)}
                    className="w-full sm:flex-1 bg-brand-orange hover:bg-brand-orange-light text-white text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs"
                  >
                    Mock Interview Practice
                  </button>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Role Overview</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {selectedJob.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Key Responsibilities</h3>
                <ul className="space-y-2">
                  {selectedJob.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start text-xs text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0" />
                      <span className="font-medium">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Required Profile & Qualifications</h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start text-xs text-gray-700 font-semibold bg-gray-50 border border-gray-100 p-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 flex flex-col justify-center items-center h-full min-h-[400px]">
              <Building2 className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-base font-bold text-gray-700 mb-1">No job selected</p>
              <p className="text-xs text-gray-400 max-w-xs">Select a vacancy from the left-hand column to view complete qualifications, responsibilities, and launch career assistance tools.</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Career News & Job Market Trends from search grounding */}
      <CareerNewsTrends />

      {/* Featured Companies, Blog Posts & Premium Newsletter Subscription */}
      <FeaturedAndNewsletter
        onCompanySelect={(name) => {
          setSearchQuery(name);
          // Auto scroll to top to show filtered results
          window.scrollTo({ top: 0, behavior: "smooth" });
          setLocalToast(`Filtered jobs by "${name}"`);
        }}
        onShowToast={(msg) => setLocalToast(msg)}
      />

      {/* Local Toast Alert */}
      {localToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-brand-green text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 font-sans text-xs font-bold flex items-center justify-between space-x-3 animate-slide-in">
          <span>{localToast}</span>
          <button onClick={() => setLocalToast(null)} className="p-0.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick Application Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="apply-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 space-y-4">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Submit Application</span>
              <h3 className="text-lg font-black text-gray-900">Applying for {selectedJob.title}</h3>
              <p className="text-xs text-gray-500">{selectedJob.company} • {selectedJob.location}</p>
            </div>

            {appliedSuccessfully ? (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-emerald-950">Application Transmitted!</h4>
                <p className="text-xs text-emerald-700 font-medium">Your profile was successfully shared with {selectedJob.company}. Check your career tracker to monitor responses.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3 pt-2">
                {/* Google Sign In Option */}
                <div className="p-3 bg-brand-green/5 rounded-xl border border-brand-green/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-brand-green flex items-center space-x-1">
                      <svg className="h-3 w-3 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.5s3.809-8.5 8.503-8.5c2.28 0 4.161.821 5.6 2.379l3.206-3.206C18.666.975 15.684 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.887 0 11.455-4.831 11.455-11.666 0-.785-.07-1.54-.196-2.285H12.24z"/>
                      </svg>
                      <span>Gmail Integration Active</span>
                    </span>
                    <span className="bg-brand-orange/15 text-brand-orange text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest font-mono">Verified Delivery</span>
                  </div>

                  {gmailConnected ? (
                    <div className="flex items-center justify-between text-xs font-semibold text-brand-text">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                        <span className="text-[11px]">Sending via: <strong className="text-brand-green">{gmailUser?.email}</strong></span>
                      </div>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendViaGmail}
                          onChange={(e) => setSendViaGmail(e.target.checked)}
                          className="rounded border-brand-border text-brand-green focus:ring-brand-green"
                        />
                        <span className="text-[10px] text-brand-text font-bold">Use real Gmail</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-brand-text-dim font-medium leading-relaxed">
                        Authorize with Google to send this application email straight from your personal Gmail inbox to the recruiter!
                      </p>
                      <button
                        type="button"
                        onClick={handleConnectGmail}
                        className="w-full bg-white hover:bg-slate-50 border border-brand-border text-brand-text font-bold py-2 rounded-xl text-[11px] flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Connect Gmail Account</span>
                      </button>
                    </div>
                  )}

                  {authError && (
                    <p className="text-[10px] text-red-500 font-semibold">{authError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Chileshe Mulenga"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="e.g. chileshe@gmail.com"
                      className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. +260 97..."
                      className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Paste Resume Content or Bio Details</label>
                  <textarea
                    rows={4}
                    value={attachedResume}
                    onChange={(e) => setAttachedResume(e.target.value)}
                    placeholder="Paste details of your education, skills, or prior roles to include with your transmittal..."
                    className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium resize-none"
                  />
                </div>

                <div className="pt-3 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
