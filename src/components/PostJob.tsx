import React, { useState } from "react";
import { PlusCircle, Building2, MapPin, DollarSign, Send, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Check, Smartphone, ShieldCheck } from "lucide-react";

export const employerPackages = [
  {
    id: "starter",
    name: "Starter",
    price: 1000,
    currency: "ZMW",
    duration: "1 Month",
    badge: "Best for Small Businesses",
    color: "bg-blue-600",
    features: [
      "Post 3 Jobs",
      "1 Month Listing",
      "Receive Unlimited Applications",
      "Company Profile",
      "Basic Candidate Search",
      "Email Support",
      "Company Logo Display",
      "Application Notifications"
    ]
  },
  {
    id: "business",
    name: "Business",
    price: 2300,
    currency: "ZMW",
    duration: "1 Month",
    badge: "Most Popular",
    color: "bg-purple-600",
    features: [
      "Post 10 Jobs",
      "1 Month Listing",
      "Featured Employer Badge",
      "Priority Search Ranking",
      "Unlimited Applications",
      "Advanced Candidate Search",
      "Company Branding",
      "Social Media Promotion",
      "Priority Email Support",
      "Employer Dashboard Analytics"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: 3200,
    currency: "ZMW",
    duration: "1 Month",
    badge: "Growing Companies",
    color: "bg-green-600",
    features: [
      "Unlimited Job Posts",
      "1 Month Listings",
      "Featured Jobs",
      "Homepage Promotion",
      "Verified Employer Badge",
      "Applicant Tracking",
      "Candidate Shortlisting",
      "CV Database Access",
      "Advanced Analytics",
      "Priority Customer Support",
      "Email Marketing Campaign",
      "Interview Scheduling"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 8500,
    currency: "ZMW",
    duration: "2 Months",
    badge: "Premium",
    color: "bg-amber-500",
    features: [
      "Unlimited Job Posts",
      "Unlimited Featured Jobs",
      "2 Months Subscription",
      "Homepage Banner Placement",
      "Verified Premium Employer",
      "Unlimited CV Database Access",
      "AI Candidate Matching",
      "Dedicated Account Manager",
      "Recruitment Campaign Management",
      "Bulk Job Upload",
      "Unlimited Team Members",
      "API Integration",
      "Custom Company Career Page",
      "Priority Recruitment Support",
      "Monthly Recruitment Reports",
      "Interview Management",
      "Premium Branding",
      "WhatsApp Recruitment Alerts"
    ]
  }
];

interface PostJobProps {
  onJobPosted: () => void;
}

const SECTORS = ["Mining", "Financial Services", "NGOs", "Agriculture", "Tech", "Health", "Education", "Retail & Hospitality"];
const LOCATIONS = ["Lusaka", "Solwezi", "Ndola", "Kitwe", "Livingstone", "Chisamba", "Chipata", "Kabwe", "Mansa", "Kasama"];
const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior", "Executive"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

export default function PostJob({ onJobPosted }: PostJobProps) {
  // Step state: "package" | "form" | "payment"
  const [step, setStep] = useState<"package" | "form" | "payment">("package");
  const [selectedPackage, setSelectedPackage] = useState(employerPackages[1]); // Default to Business package
  const [momoProvider, setMomoProvider] = useState<"Airtel" | "MTN" | "Zamtel">("Airtel");

  // Form input fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Lusaka");
  const [type, setType] = useState("Full-time");
  const [sector, setSector] = useState("Mining");
  const [experience, setExperience] = useState("Mid");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [responsibilitiesInput, setResponsibilitiesInput] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Airtel Money state
  const [airtelNumber, setAirtelNumber] = useState("");
  const [txnReference, setTxnReference] = useState("");

  const [posting, setPosting] = useState(false);
  const [postedSuccessfully, setPostedSuccessfully] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPackage = (pkg: typeof employerPackages[0]) => {
    setSelectedPackage(pkg);
    setStep("form");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description || !contactEmail) {
      setError("Please fill in all mandatory fields highlighted in red.");
      return;
    }
    setError(null);
    setStep("payment");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!airtelNumber.trim()) {
      setError("Please enter your Airtel Money phone number.");
      return;
    }
    if (!txnReference.trim()) {
      setError("Please enter the 10-character transaction reference ID from your Airtel Money SMS confirmation.");
      return;
    }

    try {
      setPosting(true);
      setError(null);

      const requirements = requirementsInput
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const responsibilities = responsibilitiesInput
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company,
          location,
          type,
          sector,
          experience,
          salary: salary || "Negotiable",
          description,
          requirements,
          responsibilities,
          contactEmail,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          paymentMethod: "Airtel Money",
          paymentNumber: airtelNumber,
          paymentRef: txnReference
        }),
      });

      if (!res.ok) throw new Error("Failed to post vacancy listing. Please retry.");

      setPostedSuccessfully(true);
      onJobPosted();

      // Reset form
      setTitle("");
      setCompany("");
      setLocation("Lusaka");
      setType("Full-time");
      setSector("Mining");
      setExperience("Mid");
      setSalary("");
      setDescription("");
      setRequirementsInput("");
      setResponsibilitiesInput("");
      setContactEmail("");
      setAirtelNumber("");
      setTxnReference("");

      setTimeout(() => {
        setPostedSuccessfully(false);
        setStep("package");
      }, 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while posting job details.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="post-job-tab">
      {/* Tab intro */}
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-2xl font-display font-bold text-brand-green flex items-center space-x-2">
          <PlusCircle className="h-6 w-6 text-brand-orange" />
          <span>Employer Portal - Post a Job</span>
        </h2>
        <p className="text-xs text-brand-text-dim font-semibold mt-0.5">
          Advertise vacancies to top talent in Zambia. Select from high-impact exposure packages and verify instantly using Airtel Money.
        </p>
      </div>

      {postedSuccessfully ? (
        <div className="bg-brand-green/5 rounded-2xl border border-brand-green/10 p-12 text-center space-y-4 max-w-2xl mx-auto shadow-sm" id="post-success-panel">
          <div className="h-16 w-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-brand-green uppercase tracking-wide">Listing Activated!</h3>
            <p className="text-xs text-brand-text font-bold max-w-md mx-auto leading-relaxed">
              We received your Airtel Money reference code (<span className="font-mono text-brand-orange">{txnReference}</span>). Your <span className="text-brand-green font-extrabold">{selectedPackage.name}</span> listing was successfully compiled and activated. Candidates across Zambia can now view and apply for your opening.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center max-w-xl mx-auto px-4">
            <div className="flex items-center w-full justify-between text-xs font-bold text-brand-text-dim">
              <button
                onClick={() => setStep("package")}
                className={`flex flex-col items-center space-y-1 focus:outline-none ${step === "package" ? "text-brand-green" : ""}`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border font-mono text-[10px] ${step === "package" ? "border-brand-green bg-brand-green/10 font-bold" : "border-brand-border"}`}>1</span>
                <span>Choose Package</span>
              </button>
              <div className="h-0.5 flex-1 bg-brand-border mx-3 -mt-4" />
              <button
                onClick={() => { if (step !== "package") setStep("form"); }}
                disabled={step === "package"}
                className={`flex flex-col items-center space-y-1 focus:outline-none disabled:opacity-50 ${step === "form" ? "text-brand-green" : ""}`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border font-mono text-[10px] ${step === "form" ? "border-brand-green bg-brand-green/10 font-bold" : "border-brand-border"}`}>2</span>
                <span>Job Details</span>
              </button>
              <div className="h-0.5 flex-1 bg-brand-border mx-3 -mt-4" />
              <div className={`flex flex-col items-center space-y-1 ${step === "payment" ? "text-brand-green" : "opacity-50"}`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border font-mono text-[10px] ${step === "payment" ? "border-brand-green bg-brand-green/10 font-bold" : "border-brand-border"}`}>3</span>
                <span>Airtel Checkout</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-xs text-red-800 max-w-3xl mx-auto">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* STEP 1: Packages */}
          {step === "package" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-display font-black text-brand-green">Select an Employer Exposure Package</h3>
                <p className="text-xs text-brand-text-dim max-w-lg mx-auto font-medium">
                  Choose the level of campaign outreach, duration, and priority discovery tools needed for your vacancy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {employerPackages.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? "border-brand-green ring-2 ring-brand-green/20 shadow-md transform scale-[1.02]"
                          : "border-brand-border hover:border-brand-text-dim hover:shadow-xs"
                      }`}
                    >
                      {/* Badge */}
                      <div className="p-5 pb-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                          {pkg.badge}
                        </span>
                        <h4 className="text-base font-display font-black text-brand-green mt-2">{pkg.name}</h4>
                        
                        <div className="mt-4 flex items-baseline">
                          <span className="text-2xl font-black font-mono text-brand-green">{pkg.currency} {pkg.price.toLocaleString()}</span>
                          <span className="text-[10px] text-brand-text-dim font-bold ml-1">/ {pkg.duration}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-[1px] bg-brand-border my-4 mx-5" />

                      {/* Features */}
                      <ul className="px-5 space-y-2 mb-6 flex-1">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5 text-xs text-brand-text font-semibold">
                            <Check className="h-3.5 w-3.5 text-brand-green mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Button */}
                      <div className="p-5 pt-0">
                        <button
                          onClick={() => handleSelectPackage(pkg)}
                          className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            isSelected
                              ? "bg-brand-green text-white hover:bg-brand-green-dark shadow-sm"
                              : "bg-brand-bg-alt text-brand-green border border-brand-border hover:bg-brand-border"
                          }`}
                        >
                          <span>Select {pkg.name}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Job Form */}
          {step === "form" && (
            <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 max-w-3xl mx-auto animate-fade-in" id="post-job-form-card">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-6">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-orange">Selected Package: {selectedPackage.name}</span>
                  <h3 className="text-sm font-bold text-brand-green">Enter Vacancy Specifics</h3>
                </div>
                <button
                  onClick={() => setStep("package")}
                  className="text-xs text-brand-green font-bold flex items-center space-x-1 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Change Package</span>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-brand-green uppercase tracking-wider pb-1 border-b border-brand-border font-mono">
                    1. Basic Identification
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Corporate Relationship Manager"
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                        Hiring Company Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Building2 className="h-4 w-4 text-brand-text-dim absolute left-3" />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Zanaco PLC"
                          className="w-full text-xs border border-brand-border rounded-lg pl-9 pr-3 py-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classification & Compensation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-brand-green uppercase tracking-wider pb-1 border-b border-brand-border font-mono">
                    2. Classification & Compensation
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Sector Category</label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                      >
                        {SECTORS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Employment Location</label>
                      <div className="relative flex items-center">
                        <MapPin className="h-4 w-4 text-brand-text-dim absolute left-3" />
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full text-xs border border-brand-border rounded-lg pl-9 pr-3 py-2.5 bg-brand-bg-alt/40 text-brand-text focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                        >
                          {LOCATIONS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Contract Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                      >
                        {JOB_TYPES.map((jt) => (
                          <option key={jt} value={jt}>{jt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Target Experience</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                      >
                        {EXPERIENCE_LEVELS.map((el) => (
                          <option key={el} value={el}>{el}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Monthly Salary Band (Optional)</label>
                      <div className="relative flex items-center">
                        <DollarSign className="h-4 w-4 text-brand-text-dim absolute left-3" />
                        <input
                          type="text"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="e.g. ZMW 15,000 - 25,000 / month"
                          className="w-full text-xs border border-brand-border rounded-lg pl-9 pr-3 py-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                        Employer Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. HR@mycompany.co.zm"
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Description / Requirements */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-green uppercase tracking-wider pb-1 border-b border-brand-border font-mono">
                    3. Detailed Specs & Qualifications
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                      Vacancy Description Overview <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Outline the core purpose of this role, operational parameters, or unit alignment..."
                      className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                        Candidate Profile & Requirements (One per line)
                      </label>
                      <textarea
                        rows={5}
                        value={requirementsInput}
                        onChange={(e) => setRequirementsInput(e.target.value)}
                        placeholder="e.g. Registered with EIZ&#10;At least 5 years of open-pit experience&#10;BSc Mining Engineering from CBU"
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">
                        Role Responsibilities (One per line)
                      </label>
                      <textarea
                        rows={5}
                        value={responsibilitiesInput}
                        onChange={(e) => setResponsibilitiesInput(e.target.value)}
                        placeholder="e.g. Schedule production cycles&#10;Draft daily hauling sheets&#10;Supervise drill teams"
                        className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep("package")}
                    className="flex-1 bg-brand-bg-alt hover:bg-brand-border text-brand-green text-xs font-bold py-3.5 rounded-xl border border-brand-border shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Packages</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-[2] bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Proceed to Secure Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Payment Checkout Popup Modal */}
          {step === "payment" && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="momo-checkout-modal">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-brand-orange animate-bounce" />
                    <div>
                      <h3 className="text-sm font-black text-brand-green">Mobile Money Secure Checkout</h3>
                      <p className="text-[10px] text-brand-text-dim font-bold">ZAMBIAN LOCAL GATEWAY v2.1</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep("form")}
                    className="text-xs text-brand-green font-bold flex items-center space-x-0.5 hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Edit Form</span>
                  </button>
                </div>

                {/* Carrier Selection Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-bg-alt rounded-xl border border-brand-border">
                  <button
                    type="button"
                    onClick={() => setMomoProvider("Airtel")}
                    className={`text-[10px] font-black py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      momoProvider === "Airtel"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-brand-text hover:bg-white"
                    }`}
                  >
                    <span className="font-sans">Airtel Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMomoProvider("MTN")}
                    className={`text-[10px] font-black py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      momoProvider === "MTN"
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-brand-text hover:bg-white"
                    }`}
                  >
                    <span className="font-sans">MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMomoProvider("Zamtel")}
                    className={`text-[10px] font-black py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                      momoProvider === "Zamtel"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-brand-text hover:bg-white"
                    }`}
                  >
                    <span className="font-sans">Zamtel Kwacha</span>
                  </button>
                </div>

                {/* Order Summary */}
                <div className="bg-brand-bg-alt rounded-xl p-4 border border-brand-border space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text font-bold">Selected Campaign Tier:</span>
                    <span className="text-brand-green font-extrabold">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text font-bold">Campaign Lifespan:</span>
                    <span className="text-brand-text-dim font-bold">{selectedPackage.duration}</span>
                  </div>
                  <div className="h-[1px] bg-brand-border my-1" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text font-bold">Total Bill Amount:</span>
                    <span className="text-sm font-black font-mono text-brand-green">{selectedPackage.currency} {selectedPackage.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Secure Payment Steps */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-2.5">
                    <div className="h-5 w-5 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-[10px] font-black font-mono mt-0.5 flex-shrink-0">1</div>
                    <div className="text-xs text-brand-text font-semibold leading-relaxed">
                      <span>Send exactly </span>
                      <strong className="font-mono text-brand-green">{selectedPackage.currency} {selectedPackage.price.toLocaleString()}</strong>
                      <span> via </span>
                      <strong className="text-brand-green">{momoProvider} Mobile Money</strong>
                      <span> to the central payment line:</span>
                      <span className="block mt-1.5 p-2.5 bg-slate-950 text-white rounded-xl font-mono font-black text-center tracking-wider text-sm select-all">
                        +260975222136
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <div className="h-5 w-5 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-[10px] font-black font-mono mt-0.5 flex-shrink-0">2</div>
                    <div className="flex-1 space-y-3">
                      <p className="text-xs text-brand-text font-semibold leading-relaxed">
                        Fill in your transaction details to verify your payment and publish the vacancy listing:
                      </p>

                      <form onSubmit={handleConfirmPayment} className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-brand-text-dim mb-1">
                            Your Mobile Money Phone Number
                          </label>
                          <input
                            type="text"
                            required
                            value={airtelNumber}
                            onChange={(e) => setAirtelNumber(e.target.value)}
                            placeholder="e.g. +260975222136 or 0975222136"
                            className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold uppercase text-brand-text-dim mb-1">
                            10-Digit {momoProvider} SMS Transaction ID / Reference Code
                          </label>
                          <input
                            type="text"
                            required
                            value={txnReference}
                            onChange={(e) => setTxnReference(e.target.value)}
                            placeholder="e.g. TXN10394857"
                            className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold font-mono uppercase"
                          />
                        </div>

                        <div className="flex items-center space-x-1.5 text-[10px] text-brand-text-dim font-semibold bg-brand-bg-alt p-2.5 rounded-lg border border-brand-border">
                          <ShieldCheck className="h-4 w-4 text-brand-green flex-shrink-0" />
                          <span>Verifications are processed instantly upon submission.</span>
                        </div>

                        <div className="flex space-x-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setStep("form")}
                            className="flex-1 bg-brand-bg-alt hover:bg-brand-border text-brand-green text-xs font-bold py-3 rounded-xl border border-brand-border shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>

                          <button
                            type="submit"
                            disabled={posting}
                            className="flex-[2] bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            {posting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                <span>Activating...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 text-brand-orange animate-pulse" />
                                <span>Verify & Publish</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
