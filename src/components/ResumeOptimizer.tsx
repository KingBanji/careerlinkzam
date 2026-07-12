import React, { useState, useEffect } from "react";
import { FileText, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, Copy, GraduationCap, Award, ShieldCheck } from "lucide-react";
import { Job, ResumeAnalysis } from "../types";

interface ResumeOptimizerProps {
  selectedJobForOptimization: Job | null;
  clearSelectedJob: () => void;
  addAnalysisToHistory: (title: string, company: string, score: number) => void;
}

const SAMPLE_RESUMES = [
  {
    label: "Sample Accountant Profile",
    title: "Corporate Relationship Manager",
    text: `CHILESHE MULENGA
chileshe.m@email.com | +260 977 123456 | Lusaka, Zambia

PROFESSIONAL SUMMARY
Dedicated and detail-oriented financial professional with 3 years of experience in retail banking operations. Expert in managing client accounts, preparing monthly financial spreadsheets, and basic credit appraisal. Looking to transition into a Corporate Relationship Manager role.

EDUCATION
- Bachelor of Accountancy, University of Zambia (UNZA), 2022
- Grade 12 School Certificate, Hillcrest National Technical School, 2018

EXPERIENCE
Customer Service Representative | Zambia National Commercial Bank (Zanaco)
2022 - Present | Lusaka
- Assisted retail customers with deposit and withdrawal queries.
- Prepared end-of-day cash reconciliation sheets.
- Cross-sold personal loan products to qualified bank clients.

SKILLS
- Retail Banking
- Client Relationship Management
- Financial Spreadsheet Analysis
- Cash Management
`
  },
  {
    label: "Sample Engineer Profile",
    title: "Senior Mine Planning Engineer",
    text: `KONDWELANI PHIRI
kondwelani.phiri@email.com | +260 966 888999 | Ndola, Zambia

PROFESSIONAL SUMMARY
Junior Mining Engineer with 3 years of experience in scheduling operations at a copper processing unit in Kitwe. Seeking to apply my software modeling skills to open-pit mining challenges. Extremely motivated, strong worker.

EDUCATION
- Bachelor of Engineering in Mining Engineering, Copperbelt University (CBU), 2021

EXPERIENCE
Graduate Engineer | Mopani Copper Mines
2021 - Present | Kitwe
- Monitored daily ore processing schedules in the concentrator department.
- Compiled weekly safety observation reports.
- Used basic CAD software to draft plant pipeline upgrades.

SKILLS
- CAD drafting
- Ore Processing Oversight
- Safety Audits
- MS Excel
`
  }
];

export default function ResumeOptimizer({ selectedJobForOptimization, clearSelectedJob, addAnalysisToHistory }: ResumeOptimizerProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);

  // Sync selected job details
  useEffect(() => {
    if (selectedJobForOptimization) {
      setJobTitle(selectedJobForOptimization.title);
      setJobDescription(
        `Company: ${selectedJobForOptimization.company}\nLocation: ${selectedJobForOptimization.location}\n\nDescription:\n${selectedJobForOptimization.description}\n\nRequirements:\n${selectedJobForOptimization.requirements.join("\n")}`
      );
    }
  }, [selectedJobForOptimization]);

  // Load Sample Profile
  const handleLoadSample = (sample: typeof SAMPLE_RESUMES[0]) => {
    setResumeText(sample.text);
    setJobTitle(sample.title);
    setJobDescription(`Target Position: ${sample.title}\nHighly recommended for local optimization reviews.`);
    setAnalysis(null);
    setError(null);
  };

  // Run Optimization Call
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      setError("Please paste your resume text to begin.");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysis(null);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle,
          jobDescription,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "The server encountered an error parsing your resume. Ensure your API secrets are properly injected.");
      }

      const data = await res.json();
      setAnalysis(data);
      addAnalysisToHistory(
        jobTitle || "Custom Role Optimization",
        selectedJobForOptimization?.company || "Personal Review",
        data.ratingScore
      );
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during resume analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Copy customized bullets helper
  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(index);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  return (
    <div className="space-y-6" id="resume-optimizer-tab">
      {/* Tab intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-green flex items-center space-x-2">
            <FileText className="h-6 w-6 text-brand-orange" />
            <span>Resume Optimizer</span>
          </h2>
          <p className="text-xs text-brand-text-dim font-semibold mt-0.5">
            Compare your resume directly against real Zambian job listings. Bantu matches keywords, detects missing local professional registrations, and provides custom achievements bullets.
          </p>
        </div>

        {selectedJobForOptimization && (
          <div className="bg-brand-bg-alt border border-brand-border rounded-xl px-3 py-1.5 flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-green">
              Selected: {selectedJobForOptimization.title}
            </span>
            <button
              onClick={clearSelectedJob}
              className="text-xs text-brand-orange hover:text-brand-orange-light font-bold bg-white rounded-md px-1.5 py-0.5 shadow-xs border border-brand-border"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Form + Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Application Inputs</h3>
              <div className="flex space-x-1.5" id="profile-fast-selectors">
                {SAMPLE_RESUMES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-2 py-1 rounded"
                  >
                    Load Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Target Position / Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Mine Planning Engineer"
                  className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Job Details & Description</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details of qualifications or the job description to optimize against..."
                  className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">My Current Resume Content</label>
                <textarea
                  rows={8}
                  required
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the plain text of your resume here to analyze alignment..."
                  className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-medium resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing Resume Metrics...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-brand-orange" />
                    <span>Run Optimization Review</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-7">
          {analyzing ? (
            <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-12 text-center h-full min-h-[500px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-brand-green border-t-transparent animate-spin" />
                <TrendingUp className="h-6 w-6 text-brand-orange animate-pulse absolute top-5 left-5" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-brand-text">Comparing Profile Dimensions</h4>
                <p className="text-xs text-brand-text-dim font-semibold leading-relaxed">
                  Bantu is scanning your resume content for sector-specific competencies, evaluating EIZ/ZICA/HPCZ professional compliance alignments, and drafting high-impact tailored statements.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-red-950">Resume Analysis Failed</h4>
                <p className="text-xs text-red-700 font-semibold max-w-md mx-auto mt-1">
                  {error}
                </p>
              </div>
              <p className="text-[10px] text-red-400">
                Tip: Please ensure your API secrets are properly injected in the Settings sidebar.
              </p>
            </div>
           ) : analysis ? (
            <div className="space-y-6" id="resume-analysis-results">
              {/* Score card */}
              <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center pb-4 md:pb-0 md:border-r border-brand-border space-y-1">
                  <span className="text-xs font-bold text-brand-text-dim uppercase tracking-wider">Matching Score</span>
                  <div className="relative flex items-center justify-center">
                    <span className="text-5xl font-display font-black text-brand-green tracking-tight">
                      {analysis.ratingScore}%
                    </span>
                  </div>
                  <div className="w-24 mx-auto bg-brand-bg-alt h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full ${
                        analysis.ratingScore >= 80 ? "bg-brand-green" : analysis.ratingScore >= 60 ? "bg-brand-orange" : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.ratingScore}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-8 space-y-2">
                  <h4 className="text-sm font-black text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
                    <TrendingUp className="h-4 w-4 text-brand-orange" />
                    <span>Recruiter Assessment</span>
                  </h4>
                  <p className="text-xs text-brand-text leading-relaxed font-medium">
                    {analysis.matchAssessment}
                  </p>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-3">
                  <h4 className="text-xs font-black text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    <span>Identified Strengths</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start text-xs text-brand-text font-semibold bg-brand-green/5 p-2 rounded-lg border border-brand-green/10">
                        <ChevronRight className="h-3.5 w-3.5 text-brand-green mt-0.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-3">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertCircle className="h-4 w-4 text-brand-orange" />
                    <span>Competency Gaps</span>
                  </h4>
                  <ul className="space-y-2">
                    {analysis.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start text-xs text-brand-text font-semibold bg-brand-orange/5 p-2 rounded-lg border border-brand-orange/10">
                        <ChevronRight className="h-3.5 w-3.5 text-brand-orange mt-0.5 flex-shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Local Zambian Regulations Board */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-6 space-y-3">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <span>Zambian Professional compliance review</span>
                </h4>
                <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                  {analysis.zambianCompliance}
                </p>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>Structural Recommendations</span>
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start text-xs text-gray-600">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] mt-0.5 mr-2 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tailored Achievements Bullets */}
              <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-3">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-black text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
                    <Award className="h-4 w-4 text-brand-orange" />
                    <span>Copyable Customized Bullets</span>
                  </h4>
                  <span className="text-[9px] text-brand-text-dim font-bold uppercase">Tailored Accomplishments</span>
                </div>
                <p className="text-xs text-brand-text-dim font-medium">
                  We have rewritten lines of your work history to better fit the target requirements. Copy and replace them inside your CV.
                </p>
                <div className="space-y-2.5">
                  {analysis.tailoredBulletPoints.map((bullet, idx) => (
                    <div 
                      key={idx} 
                      className="group flex justify-between items-start p-3 bg-brand-bg-alt/40 rounded-xl border border-brand-border hover:bg-brand-green/5 hover:border-brand-green/20 transition-all gap-4"
                    >
                      <p className="text-xs text-brand-text font-semibold leading-relaxed italic">
                        "{bullet}"
                      </p>
                      <button
                        onClick={() => handleCopyBullet(bullet, idx)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex-shrink-0 flex items-center space-x-1 ${
                          copiedBulletIdx === idx 
                            ? "bg-brand-green border-brand-green text-white"
                            : "bg-white border-brand-border text-brand-text-dim hover:bg-brand-bg-alt"
                        }`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedBulletIdx === idx ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 flex flex-col justify-center items-center h-full min-h-[500px]">
              <FileText className="h-16 w-16 text-gray-200 mb-2" />
              <p className="text-base font-bold text-gray-700 mb-1">Waiting for inputs</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Fill in the details on the left, load one of our realistic sample profiles, or select a vacancy in the "Find Jobs" tab to initiate a comprehensive resume audit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
