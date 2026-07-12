import React, { useState, useEffect } from "react";
import { BrainCircuit, AlertCircle, CheckCircle2, ArrowRight, ChevronLeft, RefreshCw, Send, HelpCircle, Lightbulb, BookOpen } from "lucide-react";
import { Job, InterviewQuestion, InterviewEvaluation } from "../types";

interface InterviewPrepProps {
  selectedJobForInterview: Job | null;
  clearSelectedJob: () => void;
  addInterviewToHistory: (title: string, score: number, rating: string) => void;
}

export default function InterviewPrep({ selectedJobForInterview, clearSelectedJob, addInterviewToHistory }: InterviewPrepProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [sector, setSector] = useState("General");
  const [experienceLevel, setExperienceLevel] = useState("Mid");
  
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected job details
  useEffect(() => {
    if (selectedJobForInterview) {
      setJobTitle(selectedJobForInterview.title);
      setSector(selectedJobForInterview.sector);
      setExperienceLevel(selectedJobForInterview.experience);
    }
  }, [selectedJobForInterview]);

  // Start interview - generate questions
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle) return;

    try {
      setGenerating(true);
      setError(null);
      setQuestions([]);
      setCurrentQuestionIdx(0);
      setUserAnswer("");

      const res = await fetch("/api/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, sector, experienceLevel }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate mock questions. Verify API configurations in Settings.");
      }

      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during interview setup.");
    } finally {
      setGenerating(false);
    }
  };

  // Submit single answer evaluation
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert("Please type an answer to submit.");
      return;
    }

    const currentQuestion = questions[currentQuestionIdx];
    if (!currentQuestion) return;

    try {
      setSubmittingAnswer(true);
      setError(null);

      const res = await fetch("/api/interview/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          question: currentQuestion.question,
          userAnswer,
        }),
      });

      if (!res.ok) throw new Error("Could not evaluate response. Check connectivity.");

      const evaluationData: InterviewEvaluation = await res.json();
      
      // Update questions state with user's answer and evaluation
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIdx] = {
        ...currentQuestion,
        userAnswer,
        evaluation: evaluationData
      };
      setQuestions(updatedQuestions);

      // Record in local history tracker
      addInterviewToHistory(
        jobTitle,
        evaluationData.rating === "Excellent" ? 100 : evaluationData.rating === "Good" ? 80 : 50,
        evaluationData.rating
      );
    } catch (err: any) {
      setError(err.message || "Something went wrong while evaluating your response.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Shortcut filler: populate excellent answer
  const handleFillSample = (excellent: boolean) => {
    const currentQuestion = questions[currentQuestionIdx];
    if (!currentQuestion) return;

    if (excellent) {
      // Use points or fill with high quality
      setUserAnswer(`At my previous firm, we faced a major supply chain bottleneck during the power load-shedding scheduling periods. Recognizing that communication and planning were key, I proactively audited our resource allocation, mapped our peak electrical load times, and structured a backup shifts roster. As a result of this, we minimized production downtime by 35% and saved ZMW 120,000 in fuel waste over three months. This satisfied all management and regulatory guidelines.`);
    } else {
      setUserAnswer("Uhh, yes. I have done some mining planning and it went okay. I usually do what my boss asks me to do. It wasn't too difficult but we got the job done eventually.");
    }
  };

  return (
    <div className="space-y-6" id="interview-prep-tab">
      {/* Tab intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-green flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-brand-orange" />
            <span>Interview Preparation Portal</span>
          </h2>
          <p className="text-xs text-brand-text-dim font-semibold mt-0.5">
            Prepare for senior roles in Zambia. Get customized interview questions, submit your verbal or written responses, and receive comprehensive evaluations from Bantu's grading engine.
          </p>
        </div>

        {selectedJobForInterview && (
          <div className="bg-brand-bg-alt border border-brand-border rounded-xl px-3 py-1.5 flex items-center space-x-2">
            <span className="text-xs font-bold text-brand-green">
              Target: {selectedJobForInterview.title}
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

      {questions.length === 0 ? (
        /* Configuration Screen */
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-brand-border shadow-xs p-6" id="interview-setup-box">
          <div className="text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-brand-bg-alt text-brand-green flex items-center justify-center mx-auto mb-2 font-bold text-lg border border-brand-border">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-base font-display font-bold text-brand-green uppercase tracking-wider">Configure Mock Session</h3>
            <p className="text-xs text-brand-text-dim">Tailor the interview panel questions to your profile goals.</p>
          </div>

          <form onSubmit={handleStartInterview} className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Target Position / Title</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Corporate Relationship Manager"
                className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Sector Area</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white font-semibold"
                >
                  <option value="Mining">Mining</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="NGOs">NGOs</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Tech">Tech</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="General">General/Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white font-semibold"
                >
                  <option value="Entry">Entry / Graduate</option>
                  <option value="Mid">Mid-Level Professional</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Executive">Executive / Director</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Assembling Question Panel...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4 text-brand-orange" />
                  <span>Generate Questions & Start Practice</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Active Interview Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="active-interview-workspace">
          {/* Question / Response Card (Left) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 relative">
              {/* Question Navigation Header */}
              <div className="flex justify-between items-center border-b border-brand-border pb-3">
                <span className="text-xs font-bold text-brand-green">
                  QUESTION {currentQuestionIdx + 1} OF {questions.length}
                </span>
                <span className="text-[10px] bg-brand-bg-alt text-brand-text-dim font-bold px-2.5 py-0.5 rounded-full uppercase border border-brand-border">
                  {questions[currentQuestionIdx].category}
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5 pt-1">
                <h3 className="text-base font-display font-bold text-brand-green leading-snug">
                  {questions[currentQuestionIdx].question}
                </h3>
                <p className="text-[11px] text-brand-text-dim font-medium italic flex items-center space-x-1">
                  <HelpCircle className="h-3.5 w-3.5 flex-shrink-0 text-brand-orange" />
                  <span>Purpose: {questions[currentQuestionIdx].purpose}</span>
                </p>
              </div>

              {/* Tips Callout */}
              <div className="p-3 bg-brand-green/5 rounded-xl border border-brand-green/10 space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-green flex items-center space-x-1">
                  <Lightbulb className="h-3 w-3 text-brand-orange fill-brand-orange/20" />
                  <span>Recruiter Tips: What to hit</span>
                </span>
                <ul className="grid grid-cols-1 gap-1 pl-1">
                  {questions[currentQuestionIdx].keyPointsToInclude.map((pt, i) => (
                    <li key={i} className="text-[10px] text-brand-text font-bold flex items-center">
                      <span className="h-1 w-1 bg-brand-orange rounded-full mr-1.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Answer Input area */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-brand-text-dim font-mono">My Formulated Response</label>
                  {!questions[currentQuestionIdx].evaluation && (
                    <div className="flex space-x-1.5" id="fill-shortcuts">
                      <button
                        onClick={() => handleFillSample(true)}
                        className="text-[9px] text-brand-green font-extrabold hover:underline"
                      >
                        [Fill Good Answer]
                      </button>
                      <button
                        onClick={() => handleFillSample(false)}
                        className="text-[9px] text-brand-orange font-extrabold hover:underline"
                      >
                        [Fill Poor Answer]
                      </button>
                    </div>
                  )}
                </div>

                {questions[currentQuestionIdx].evaluation ? (
                  <div className="p-4 bg-brand-bg-alt/30 rounded-xl border border-brand-border font-mono text-xs text-brand-text min-h-[120px] whitespace-pre-wrap">
                    {questions[currentQuestionIdx].userAnswer}
                  </div>
                ) : (
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response structure here (Use the STAR format: Describe the Situation, your specific Task, the Action taken, and final quantifiable Results)..."
                    className="w-full text-xs border border-brand-border rounded-lg p-2.5 bg-brand-bg-alt/40 text-brand-text placeholder-brand-text-dim focus:outline-none focus:border-brand-green focus:bg-white font-medium resize-none"
                  />
                )}
              </div>

              {/* Submit / Navigation Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <button
                  onClick={() => {
                    if (currentQuestionIdx > 0) {
                      setCurrentQuestionIdx(currentQuestionIdx - 1);
                      setUserAnswer(questions[currentQuestionIdx - 1].userAnswer || "");
                    }
                  }}
                  disabled={currentQuestionIdx === 0}
                  className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-800 font-bold disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                {!questions[currentQuestionIdx].evaluation ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submittingAnswer || !userAnswer.trim()}
                    className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                  >
                    {submittingAnswer ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-brand-orange" />
                        <span>Submit Response</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (currentQuestionIdx < questions.length - 1) {
                        setCurrentQuestionIdx(currentQuestionIdx + 1);
                        setUserAnswer(questions[currentQuestionIdx + 1].userAnswer || "");
                      } else {
                        // All done! Reset panel options
                        if (confirm("You have gone through the questions. Ready to set up another practice round?")) {
                          setQuestions([]);
                        }
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <span>{currentQuestionIdx < questions.length - 1 ? "Next Question" : "Start New Practice"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grading & Feedback (Right) */}
          <div className="lg:col-span-6 space-y-4" id="grading-side">
            {submittingAnswer ? (
              <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-12 text-center h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-brand-green border-t-transparent animate-spin" />
                  <BrainCircuit className="h-5 w-5 text-brand-orange animate-pulse absolute top-3.5 left-3.5" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <h4 className="text-sm font-bold text-brand-text">Assessing Response Logic</h4>
                  <p className="text-xs text-brand-text-dim font-semibold leading-relaxed">
                    Bantu is matching your details against best practices, scoring communication depth, and preparing professional phrasing revisions.
                  </p>
                </div>
              </div>
            ) : questions[currentQuestionIdx].evaluation ? (
              <div className="space-y-4" id="evaluation-card">
                {/* Scoring Header */}
                <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider block font-mono">Grading Scorecard</span>
                    <h4 className="text-base font-display font-bold text-brand-green uppercase">
                      Verdict: {questions[currentQuestionIdx].evaluation?.rating}
                    </h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                    questions[currentQuestionIdx].evaluation?.rating === "Excellent"
                      ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                      : questions[currentQuestionIdx].evaluation?.rating === "Good"
                      ? "bg-brand-orange/10 text-brand-orange border-brand-orange/20"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {questions[currentQuestionIdx].evaluation?.rating}
                  </span>
                </div>

                {/* Critiques */}
                <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-4">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-black text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
                      <BookOpen className="h-4 w-4 text-brand-orange" />
                      <span>Hiring Manager's Review</span>
                    </h5>
                    <p className="text-xs text-brand-text leading-relaxed font-semibold">
                      {questions[currentQuestionIdx].evaluation?.feedback}
                    </p>
                  </div>

                  {questions[currentQuestionIdx].evaluation?.gapsIdentified.length && (
                    <div className="space-y-2 pt-2 border-t border-brand-border">
                      <h5 className="text-xs font-black text-brand-orange uppercase tracking-wider flex items-center space-x-1.5">
                        <AlertCircle className="h-4 w-4 text-brand-orange" />
                        <span>Omitted/Missing Factors</span>
                      </h5>
                      <ul className="space-y-1 pl-1">
                        {questions[currentQuestionIdx].evaluation?.gapsIdentified.map((gap, i) => (
                          <li key={i} className="text-xs text-brand-text font-medium flex items-start">
                            <span className="text-brand-orange mr-2 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interviwer Cultural Tips */}
                  <div className="bg-brand-orange/5 p-4 border border-brand-orange/10 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-brand-orange">Zambian Cultural Context Tips</span>
                    <p className="text-xs text-brand-text font-semibold leading-relaxed">
                      {questions[currentQuestionIdx].evaluation?.interviewerTips}
                    </p>
                  </div>
                </div>

                {/* Stronger Phrasing Proposal */}
                <div className="bg-brand-green text-white rounded-2xl border border-brand-green-dark p-6 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-brand-orange/15 rounded-full blur-xl" />
                  <h5 className="text-xs font-black text-brand-orange-light uppercase tracking-wider flex items-center space-x-1.5">
                    <Lightbulb className="h-4 w-4 text-brand-orange-light" />
                    <span>Optimized Phrasing Proposal</span>
                  </h5>
                  <p className="text-xs text-brand-bg-alt font-semibold leading-relaxed italic bg-black/15 p-3 rounded-lg border border-white/10">
                    "{questions[currentQuestionIdx].evaluation?.suggestedPhrasing}"
                  </p>
                  <p className="text-[10px] text-brand-bg-alt/75">
                    Pro-tip: Read this out loud a few times to commit the structure to memory before your real panel!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-12 text-center text-brand-text-dim flex flex-col justify-center items-center h-full min-h-[400px]">
                <BrainCircuit className="h-16 w-16 text-brand-bg-alt mb-2" />
                <p className="text-base font-bold text-brand-text mb-1">Waiting for response submission</p>
                <p className="text-xs text-brand-text-dim max-w-xs">
                  Read the question on the left, type up your strategic answer using the hints provided, and submit your response to receive real-time granular evaluation and scoring from Bantu.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
