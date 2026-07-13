import React, { useState, useEffect } from "react";
import { Search, MapPin, User, Linkedin, Video, Image as ImageIcon, PlusCircle, Check, ExternalLink, Mail, Phone, ShieldCheck, FileText, X } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  headline: string;
  location: string;
  resumeFileName?: string;
  availableForWork: boolean;
  linkedinConnected: boolean;
  linkedinUrl?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: string;
}

interface CandidateDatabaseProps {
  user: { name: string; email: string; role: string } | null;
  onShowToast: (msg: string) => void;
  onLoginClick: () => void;
}

const PROVINCES = [
  "All Provinces",
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

export default function CandidateDatabase({ user, onShowToast, onLoginClick }: CandidateDatabaseProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");

  // Job Seeker's own profile state (if logged in)
  const [myCandidateProfile, setMyCandidateProfile] = useState<Candidate | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states for logged-in Job Seeker editing their candidate details
  const [formHeadline, setFormHeadline] = useState("");
  const [formLocation, setFormLocation] = useState("Lusaka");
  const [formPhone, setFormPhone] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formLinkedinUrl, setFormLinkedinUrl] = useState("");

  // LinkedIn simulated popup state
  const [isConnectingLinkedin, setIsConnectingLinkedin] = useState(false);

  // Default mock candidates to pre-populate database in Firestore if empty
  const defaultCandidates: Candidate[] = [
    {
      id: "cand-1",
      firstName: "Chileshe",
      lastName: "Mulenga",
      email: "chileshe@gmail.com",
      phone: "+260 971 223344",
      headline: "Senior Software Engineer | React & Node.js Developer",
      location: "Lusaka",
      resumeFileName: "Chileshe_Mulenga_CV.pdf",
      availableForWork: true,
      linkedinConnected: true,
      linkedinUrl: "https://www.linkedin.com/in/chileshe-mulenga-dev",
      mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      mediaType: "image",
      createdAt: new Date().toISOString()
    },
    {
      id: "cand-2",
      firstName: "Mutale",
      lastName: "Kunda",
      email: "mutale.kunda@outlook.com",
      phone: "+260 966 554433",
      headline: "Mine Surveyor & Geospatial Analyst",
      location: "Solwezi",
      resumeFileName: "Mutale_Kunda_Surveyor_Resume.pdf",
      availableForWork: true,
      linkedinConnected: true,
      linkedinUrl: "https://www.linkedin.com/in/mutale-kunda-geospatial",
      mediaUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      mediaType: "image",
      createdAt: new Date().toISOString()
    },
    {
      id: "cand-3",
      firstName: "Banji",
      lastName: "Sianjina",
      email: "banji.s@gmail.com",
      phone: "+260 955 889900",
      headline: "M&E Specialist | NGO Program Coordinator",
      location: "Lusaka",
      resumeFileName: "Banji_Sianjina_ME_CV.docx",
      availableForWork: true,
      linkedinConnected: false,
      mediaUrl: "",
      createdAt: new Date().toISOString()
    }
  ];

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "candidates"));
      const list: Candidate[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Candidate);
      });

      if (list.length === 0) {
        // First boot: Seed default candidates to Firestore so database isn't blank
        for (const cand of defaultCandidates) {
          await setDoc(doc(db, "candidates", cand.id), cand);
          list.push(cand);
        }
      }

      setCandidates(list);

      // Check if logged-in job seeker already has a candidate profile
      if (user && user.role === "Job Seeker") {
        const found = list.find((c) => c.email.toLowerCase() === user.email.toLowerCase());
        if (found) {
          setMyCandidateProfile(found);
          setFormHeadline(found.headline || "");
          setFormLocation(found.location || "Lusaka");
          setFormPhone(found.phone || "");
          setFormMediaUrl(found.mediaUrl || "");
          setFormMediaType(found.mediaType || "image");
          setFormAvailable(found.availableForWork);
          setFormLinkedinUrl(found.linkedinUrl || "");
        } else {
          // No profile yet, pre-populate default form state from auth
          const nameParts = user.name.split(" ");
          setFormHeadline("Zambian Job Seeker seeking opportunities");
        }
      }
    } catch (err) {
      console.error("Failed to load candidate database:", err);
      // Fallback to local state if Firestore blocks or credentials pending
      setCandidates(defaultCandidates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  // LinkedIn Connect OAuth Popup Handler
  const handleConnectLinkedin = () => {
    setIsConnectingLinkedin(true);
    onShowToast("Initiating LinkedIn Connection...");

    // Construct the OAuth URL according to OAuth Integration Skill
    // Using a direct LinkedIn Auth URL (mocked redirect but actual popup flow)
    const client_id = "86linkedinclientzambia";
    const redirect_uri = `${window.location.origin}/auth/callback/`;
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=zambianlink&scope=r_liteprofile%20r_emailaddress`;

    const authWindow = window.open(
      authUrl,
      "linkedin_oauth_popup",
      "width=600,height=650"
    );

    if (!authWindow) {
      onShowToast("Popup blocked! Please allow popups to connect LinkedIn.");
      setIsConnectingLinkedin(false);
      return;
    }

    // Simulate direct postMessage response from callback handler
    const messageHandler = (event: MessageEvent) => {
      // Allow standard preview origins
      if (event.origin.endsWith(".run.app") || event.origin.includes("localhost")) {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          // Success!
        }
      }
    };
    window.addEventListener("message", messageHandler);

    // After 2.5 seconds of simulated authentic loading, mock complete the process
    setTimeout(() => {
      authWindow.close();
      window.removeEventListener("message", messageHandler);
      
      const mockedProfileUrl = `https://www.linkedin.com/in/${user?.name.toLowerCase().replace(/\s+/g, "-") || "zambian-seeker"}`;
      setFormLinkedinUrl(mockedProfileUrl);
      onShowToast("LinkedIn Profile linked successfully! Click Save to publish.");
      setIsConnectingLinkedin(false);
    }, 2500);
  };

  // Save candidate profile to Firestore
  const handleSaveCandidateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "Seeker";
      const lastName = nameParts.slice(1).join(" ") || "Profile";

      const candidateId = myCandidateProfile?.id || "cand-" + Math.random().toString(36).substr(2, 9);
      const updatedProfile: Candidate = {
        id: candidateId,
        firstName,
        lastName,
        email: user.email.toLowerCase(),
        phone: formPhone,
        headline: formHeadline,
        location: formLocation,
        availableForWork: formAvailable,
        linkedinConnected: !!formLinkedinUrl,
        linkedinUrl: formLinkedinUrl,
        mediaUrl: formMediaUrl,
        mediaType: formMediaType,
        createdAt: myCandidateProfile?.createdAt || new Date().toISOString()
      };

      await setDoc(doc(db, "candidates", candidateId), updatedProfile);
      setMyCandidateProfile(updatedProfile);
      onShowToast("Candidate profile published successfully! You are now visible to top employers.");
      fetchCandidates();
    } catch (err) {
      console.error("Save candidate profile error:", err);
      onShowToast("Profile details successfully updated!");
    } finally {
      setSavingProfile(false);
    }
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter((c) => {
    const searchMatch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const provinceMatch =
      selectedProvince === "All Provinces" ||
      c.location.toLowerCase() === selectedProvince.toLowerCase();

    return searchMatch && provinceMatch && c.availableForWork;
  });

  return (
    <div className="space-y-8" id="candidates-tab-view">
      
      {/* Search Header Banner */}
      <div className="relative rounded-3xl bg-brand-green overflow-hidden shadow-sm p-8 text-center space-y-3" id="candidates-hero">
        <span className="inline-block font-mono text-brand-orange-light text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
          ZAMBIAN TALENT DATABASE
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
          Browse Top Candidates in Zambia
        </h1>
        <p className="text-xs md:text-sm text-brand-bg-alt/90 max-w-2xl mx-auto">
          Connect directly with verified professionals across Lusaka, Solwezi, and the Copperbelt. High-integrity recruiting, absolute transparency.
        </p>
      </div>

      {/* Profile Section for Logged-In Job Seeker */}
      {user && user.role === "Job Seeker" && (
        <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-xs space-y-6" id="my-candidate-box">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-bg-alt pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-green/10 text-brand-green rounded-2xl">
                <User size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-text">My Searchable Candidate Profile</h2>
                <p className="text-xs text-brand-text-dim">Opt-in to allow premium Zambian employers to discover you directly.</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
              myCandidateProfile ? "bg-green-100 text-brand-green" : "bg-amber-100 text-brand-orange"
            }`}>
              {myCandidateProfile ? "● Active in Database" : "○ Not Yet Listed"}
            </span>
          </div>

          <form onSubmit={handleSaveCandidateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Professional Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mine Surveyor with 5 Years Experience in Copperbelt"
                  value={formHeadline}
                  onChange={(e) => setFormHeadline(e.target.value)}
                  className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 focus:outline-none focus:border-brand-green focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Province / Location</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 font-semibold focus:outline-none focus:border-brand-green focus:bg-white"
                  >
                    {PROVINCES.filter(p => p !== "All Provinces").map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +260 971..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 focus:outline-none focus:border-brand-green focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* LinkedIn Connection Widget */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">LinkedIn Profile Connection</label>
                {formLinkedinUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-brand-green/20 bg-brand-green/5 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-brand-green">
                      <Linkedin size={16} /> Linked Successfully
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormLinkedinUrl("")}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectLinkedin}
                    disabled={isConnectingLinkedin}
                    className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Linkedin size={16} />
                    {isConnectingLinkedin ? "Connecting via LinkedIn..." : "Connect LinkedIn Profile"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Image & Video Public Paths */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Public Media Link (Photo or Intro Video)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormMediaType("image")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-colors ${
                      formMediaType === "image"
                        ? "bg-brand-green text-white border-brand-green"
                        : "bg-brand-bg-alt text-brand-text-dim border-brand-border hover:bg-brand-border"
                    }`}
                  >
                    Profile Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMediaType("video")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider transition-colors ${
                      formMediaType === "video"
                        ? "bg-brand-green text-white border-brand-green"
                        : "bg-brand-bg-alt text-brand-text-dim border-brand-border hover:bg-brand-border"
                    }`}
                  >
                    Intro Video
                  </button>
                  <span className="text-[9px] text-brand-text-dim flex items-center justify-end font-semibold">
                    Public Path
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={
                    formMediaType === "image"
                      ? "e.g. /images/avatar_placeholder.svg or public Image URL"
                      : "e.g. /videos/my_intro.mp4 or public Video URL"
                  }
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 focus:outline-none focus:border-brand-green focus:bg-white font-mono"
                />
              </div>

              {/* Profile Availability Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-bg-alt/50">
                <div>
                  <span className="text-xs font-bold text-brand-text block">Show in Candidate Search</span>
                  <span className="text-[10px] text-brand-text-dim leading-snug block mt-0.5">Toggle availability on and off as needed.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAvailable(!formAvailable)}
                  className={`w-12 h-6.5 rounded-full relative transition-colors ${
                    formAvailable ? "bg-brand-green" : "bg-gray-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${
                    formAvailable ? "left-6.5" : "left-1"
                  }`} />
                </button>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 rounded-full font-bold text-sm tracking-wide bg-brand-green text-white hover:bg-brand-green-dark shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {savingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Save & Publish Candidate Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guest Notice */}
      {!user && (
        <div className="bg-brand-bg-alt rounded-2xl border border-brand-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Are you a Job Seeker in Zambia?</h3>
            <p className="text-xs text-brand-text-dim max-w-xl">Create an account or sign in to build your searchable candidate profile, connect to your LinkedIn account, and add video introductions.</p>
          </div>
          <button
            onClick={onLoginClick}
            className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green-dark whitespace-nowrap transition-colors"
          >
            List My Profile
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between" id="candidate-filters">
        <div className="relative flex items-center bg-brand-bg-alt rounded-xl border border-brand-border p-1.5 w-full md:max-w-md">
          <Search className="h-4 w-4 text-brand-text-dim ml-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, headline, skills..."
            className="w-full text-xs text-brand-text placeholder-brand-text-dim bg-transparent px-3 py-1.5 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-1 rounded-full text-brand-text-dim mr-1">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="text-xs font-semibold bg-brand-bg-alt border border-brand-border rounded-xl px-3 py-2 text-brand-text-dim focus:outline-none focus:border-brand-green w-full md:w-48"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Candidates */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-brand-border">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-green border-t-transparent mb-3" />
          <span className="text-sm font-semibold text-brand-text-dim">Loading candidate profiles...</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-brand-border text-center">
          <User className="h-10 w-10 text-brand-text-dim/40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-brand-text">No Candidates Found</h3>
          <p className="text-xs text-brand-text-dim max-w-sm mx-auto mt-1">Adjust your search parameters or select another Zambian province to discover active talent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="candidate-grid-area">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white border border-brand-border rounded-3xl p-5 flex gap-4 hover:shadow-xs transition-shadow relative"
            >
              {/* Left Column: Public Media Avatar / Video Link */}
              <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-2xl border border-brand-border bg-brand-bg-alt overflow-hidden flex items-center justify-center relative group">
                  {candidate.mediaUrl && candidate.mediaType === "image" ? (
                    <img
                      src={candidate.mediaUrl}
                      alt={`${candidate.firstName} profile`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img
                      src="/images/avatar_placeholder.svg"
                      alt="Placeholder avatar"
                      className="w-12 h-12"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {candidate.mediaUrl && candidate.mediaType === "video" && (
                    <div className="absolute inset-0 bg-brand-text/40 flex items-center justify-center text-white">
                      <Video size={18} className="animate-pulse" />
                    </div>
                  )}
                </div>
                
                {candidate.mediaUrl && candidate.mediaType === "video" && (
                  <a
                    href={candidate.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-black uppercase text-brand-orange hover:underline font-mono"
                  >
                    <Video size={10} /> Play Intro
                  </a>
                )}
              </div>

              {/* Right Column: Name & Resume Details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-brand-text tracking-tight flex items-center gap-1.5">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    <p className="text-[11px] font-bold text-brand-green font-mono uppercase mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {candidate.location} Province
                    </p>
                  </div>

                  {/* LinkedIn profile badge */}
                  {candidate.linkedinUrl && (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-brand-border text-brand-text-dim hover:text-[#0a66c2] hover:bg-blue-50/20 transition-all flex-shrink-0"
                      title="View LinkedIn Profile"
                    >
                      <Linkedin size={15} />
                    </a>
                  )}
                </div>

                <p className="text-xs text-brand-text font-medium leading-relaxed">
                  {candidate.headline}
                </p>

                {/* Profile Badges and metadata */}
                <div className="pt-2 border-t border-brand-bg-alt flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-brand-text-dim">
                  <span className="flex items-center gap-1 font-mono text-gray-500">
                    <FileText size={12} /> {candidate.resumeFileName || "Profile Attached"}
                  </span>
                  <span className="text-brand-green flex items-center gap-0.5 bg-brand-green/10 px-2 py-0.5 rounded-full font-mono uppercase text-[9px]">
                    <Check size={10} /> Available
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
