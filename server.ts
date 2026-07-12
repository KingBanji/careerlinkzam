import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI features will be unavailable.");
      throw new Error("GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory Job Database (Pre-seeded with high-quality, realistic Zambian jobs)
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string; // Full-time, Part-time, Contract, Internship
  sector: string; // Mining, Financial Services, NGOs, Agriculture, Tech, Health, Education
  experience: string; // Entry, Mid, Senior, Executive
  salary: string; // e.g. "ZMW 15,000 - 25,000 / month"
  description: string;
  requirements: string[];
  responsibilities: string[];
  contactEmail: string;
  createdAt: string;
}

const jobs: Job[] = [
  {
    id: "fqm-mine-eng",
    title: "Senior Mine Planning Engineer",
    company: "First Quantum Minerals (Kansanshi Mine)",
    location: "Solwezi, North-Western Province",
    type: "Full-time",
    sector: "Mining",
    experience: "Senior",
    salary: "ZMW 35,000 - 55,000 / month",
    description: "First Quantum Minerals is seeking an experienced Senior Mine Planning Engineer to join our engineering division at Kansanshi Mine. You will be responsible for short and medium-term open-pit mine planning, scheduling production targets, and designing optimal haul routes.",
    requirements: [
      "Bachelor of Engineering in Mining Engineering from UNZA, CBU or equivalent",
      "Registered member of the Engineering Institution of Zambia (EIZ)",
      "Valid Silicosis Certificate",
      "Minimum of 6 years of experience in open-pit mining operations",
      "Proficiency in Deswik, Surpac or Vulcan mine planning software"
    ],
    responsibilities: [
      "Develop safe and efficient open-pit mine plans and scheduling profiles",
      "Monitor daily production rates and match them against target goals",
      "Design waste rock dumps, haul road designs, and optimal blast patterns",
      "Provide engineering mentorship to junior mine planning engineers"
    ],
    contactEmail: "recruitment.kansanshi@fqml.com",
    createdAt: new Date().toISOString()
  },
  {
    id: "zanaco-relationship-mgr",
    title: "Corporate Relationship Manager",
    company: "Zambian National Commercial Bank (Zanaco)",
    location: "Lusaka, Lusaka Province",
    type: "Full-time",
    sector: "Financial Services",
    experience: "Mid",
    salary: "ZMW 20,000 - 32,000 / month",
    description: "Zanaco is looking for an energetic Corporate Relationship Manager to manage a portfolio of high-value corporate clients in agriculture and manufacturing sectors. You will act as the principal point of contact, structuring corporate credit facilities and offering specialized financial solutions.",
    requirements: [
      "Degree in Banking & Finance, Economics, or Business Administration",
      "Registered with the Zambia Institute of Chartered Accountants (ZICA) or Securities and Exchange Commission (SEC) is an advantage",
      "At least 4 years of experience in corporate banking relationship management",
      "Strong understanding of corporate credit analysis and risk assessment"
    ],
    responsibilities: [
      "Maintain and grow a profitable portfolio of corporate clients",
      "Structure complex corporate loans, overdrafts, and trade finance solutions",
      "Conduct regular financial health assessments and credit reviews of clients",
      "Collaborate with internal credit risk teams to ensure fast approvals"
    ],
    contactEmail: "careers@zanaco.co.zm",
    createdAt: new Date().toISOString()
  },
  {
    id: "cidrz-research-off",
    title: "Clinical Research Officer",
    company: "Centre for Infectious Disease Research in Zambia (CIDRZ)",
    location: "Lusaka, Lusaka Province",
    type: "Full-time",
    sector: "Health",
    experience: "Mid",
    salary: "ZMW 18,000 - 28,000 / month",
    description: "Join CIDRZ as a Clinical Research Officer to coordinate clinical trial activities for major community health initiatives. This role involves protocol implementation, patient monitoring, and clinical data collection, in strict compliance with local and international ethical guidelines.",
    requirements: [
      "Bachelor of Medicine & Bachelor of Surgery (MBChB) or equivalent clinical degree",
      "Fully licensed by the Health Professions Council of Zambia (HPCZ)",
      "Valid Good Clinical Practice (GCP) certification",
      "2+ years of experience working in infectious disease research or public health"
    ],
    responsibilities: [
      "Conduct medical examinations and oversee clinical care for research participants",
      "Ensure research protocols are strictly executed according to study guidelines",
      "Manage adverse event reporting and participate in ethical review submissions",
      "Verify data completeness in Case Report Forms (CRFs)"
    ],
    contactEmail: "jobs@cidrz.org.zm",
    createdAt: new Date().toISOString()
  },
  {
    id: "usaid-m-and-e",
    title: "Monitoring & Evaluation Specialist",
    company: "USAID USAID-funded Health & Education Initiative",
    location: "Lusaka, Lusaka Province",
    type: "Contract",
    sector: "NGOs",
    experience: "Mid",
    salary: "ZMW 22,000 - 35,000 / month",
    description: "We are seeking a Monitoring & Evaluation Specialist for a 2-year contract to drive data collection, quality control, and donor reporting for our provincial community health program. The ideal candidate is passionate about data and has direct experience compiling USAID reporting templates.",
    requirements: [
      "Master's or Bachelor's degree in Statistics, Demography, Public Health, or social sciences",
      "Proven competency with data analysis software: SPSS, Stata, or R",
      "Minimum 4 years of experience managing M&E databases for USAID or major international donors",
      "Excellent report-writing skills"
    ],
    responsibilities: [
      "Design and maintain the project's performance indicator tracking database",
      "Conduct routine data quality audits across district facilities",
      "Compile quarterly and annual reports for USAID submission",
      "Develop impact case studies and visualization dashboards for project stakeholders"
    ],
    contactEmail: "recruitment@zambiahealthproject.org",
    createdAt: new Date().toISOString()
  },
  {
    id: "zambeef-farm-mgr",
    title: "Agribusiness Commercial Manager",
    company: "Zambeef Products PLC",
    location: "Chisamba, Central Province",
    type: "Full-time",
    sector: "Agriculture",
    experience: "Senior",
    salary: "ZMW 25,000 - 40,000 / month",
    description: "Zambeef Products PLC is looking for an Agribusiness Commercial Manager to lead commercial operations at our Chisamba farming hub. The role will oversee crop yield planning, wholesale distribution, supply chain logistics, and grain trade contracts.",
    requirements: [
      "Degree in Agribusiness Management, Agricultural Economics, or related field",
      "5+ years of commercial management experience in a large-scale agricultural operation",
      "Strong understanding of grain marketing and agricultural contract negotiations in Zambia",
      "Ability to live and work in Chisamba (on-site housing provided)"
    ],
    responsibilities: [
      "Maximize commercial profitability of grain and livestock assets",
      "Negotiate sales and delivery contracts with major millers and food processors",
      "Coordinate harvesting logistics to minimize storage loss and optimize market timing",
      "Manage the Chisamba agribusiness commercial budget"
    ],
    contactEmail: "agricareers@zambeef.co.zm",
    createdAt: new Date().toISOString()
  },
  {
    id: "mtn-dev-lead",
    title: "Lead Full-Stack Mobile Developer",
    company: "MTN Zambia",
    location: "Lusaka, Lusaka Province",
    type: "Full-time",
    sector: "Tech",
    experience: "Senior",
    salary: "ZMW 28,000 - 45,000 / month",
    description: "MTN Zambia is recruiting a Lead Full-Stack Mobile Developer to spearhead our fintech mobile applications division. You will oversee a team of engineers designing secure, high-traffic interfaces integrated directly into our Mobile Money (MoMo) API backend.",
    requirements: [
      "BSc in Computer Science, Software Engineering, or equivalent",
      "Experience with React Native, Flutter, Node.js, or Go",
      "At least 5 years of professional software development experience",
      "Solid knowledge of secure payment gateway integrations and RESTful APIs"
    ],
    responsibilities: [
      "Lead the architecture and development of next-generation mobile financial services",
      "Provide guidance on security protocols, tokenization, and offline storage",
      "Collaborate with UX researchers to design localized, intuitive flows",
      "Conduct code reviews and mentor junior developers"
    ],
    contactEmail: "careers.zambia@mtn.com",
    createdAt: new Date().toISOString()
  }
];

// --- API ROUTES ---

// 1. Get/Search Jobs
app.get("/api/jobs", (req, res) => {
  const { query, sector, location, experience, type } = req.query;
  
  let filteredJobs = [...jobs];

  if (query) {
    const q = (query as string).toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q)
    );
  }

  if (sector && sector !== "All Sectors") {
    filteredJobs = filteredJobs.filter((job) => job.sector === sector);
  }

  if (location && location !== "All Locations") {
    filteredJobs = filteredJobs.filter((job) => job.location.includes(location as string));
  }

  if (experience && experience !== "All Levels") {
    filteredJobs = filteredJobs.filter((job) => job.experience === experience);
  }

  if (type && type !== "All Types") {
    filteredJobs = filteredJobs.filter((job) => job.type === type);
  }

  // Sort by newest first
  filteredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filteredJobs);
});

// 2. Post a New Job
app.post("/api/jobs", (req, res) => {
  try {
    const { title, company, location, type, sector, experience, salary, description, requirements, responsibilities, contactEmail } = req.body;

    if (!title || !company || !location || !sector || !description || !contactEmail) {
      return res.status(400).json({ error: "Missing required job fields." });
    }

    const newJob: Job = {
      id: "job-" + Math.random().toString(36).substr(2, 9),
      title,
      company,
      location,
      type: type || "Full-time",
      sector,
      experience: experience || "Mid",
      salary: salary || "Negotiable",
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements || "").split("\n").filter(Boolean),
      responsibilities: Array.isArray(responsibilities) ? responsibilities : (responsibilities || "").split("\n").filter(Boolean),
      contactEmail,
      createdAt: new Date().toISOString()
    };

    jobs.unshift(newJob);
    res.status(201).json(newJob);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. AI Resume Analyzer & Tailoring Suggestion Endpoint
app.post("/api/resume/analyze", async (req, res) => {
  try {
    const { resumeText, jobTitle, jobDescription, requirements } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required." });
    }

    const ai = getGeminiClient();

    const prompt = `You are an expert HR recruiter and career coach specializing in the Zambian job market.
Analyze the following resume text against the target job profile details.

TARGET JOB PROFILE:
Title: ${jobTitle || "Not Specified"}
Description: ${jobDescription || "Not Specified"}
Requirements: ${JSON.stringify(requirements || [])}

USER'S RESUME TEXT:
${resumeText}

Analyze this thoroughly. Your output must strictly be a valid JSON object matching the requested schema. Provide deep, high-value, specific feedback tailored to the Zambian professional landscape (e.g., mentioning professional bodies like ZICA for Accountants, EIZ for Engineers, LAZ for Lawyers, HPCZ/NMCZ for Health, TEVETA for vocational qualifications, and localized salary or location advice if applicable).

Provide the response in the following JSON format:
{
  "ratingScore": 85, // Integer from 0 to 100 indicating match strength
  "matchAssessment": "Brief high-level summary of how well this resume matches the target job description.",
  "strengths": ["Strength 1...", "Strength 2..."],
  "gaps": ["Gap 1 or missing skill...", "Gap 2 or missing credential..."],
  "zambianCompliance": "Assessment of whether the candidate lists necessary local certifications, registrations, or regulations (e.g. EIZ, ZICA, LAZ, Silicosis, or local university status UNZA/CBU).",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "tailoredBulletPoints": ["Sample optimized resume description bullet 1 incorporating key words", "Sample optimized resume description bullet 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["ratingScore", "matchAssessment", "strengths", "gaps", "zambianCompliance", "recommendations", "tailoredBulletPoints"],
          properties: {
            ratingScore: { type: Type.INTEGER, description: "Match score out of 100." },
            matchAssessment: { type: Type.STRING, description: "A summary text of the alignment." },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Found strengths matching the job."
            },
            gaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Missing skills, qualifications, or metrics."
            },
            zambianCompliance: {
              type: Type.STRING,
              description: "Feedback about Zambian professional bodies, associations, or local labor expectations."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable steps to rewrite, add certifications, or reorder content."
            },
            tailoredBulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Sample tailored accomplishments lines the user can paste straight into their resume."
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze resume." });
  }
});

// 4. AI Interview Prep - Question Generator
app.post("/api/interview/generate-questions", async (req, res) => {
  try {
    const { jobTitle, sector, experienceLevel } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ error: "Job title is required." });
    }

    const ai = getGeminiClient();

    const prompt = `You are a professional HR Interviewer in Zambia. Generate 5 interview questions for a candidate interviewing for the following role:
Job Title: ${jobTitle}
Sector: ${sector || "General"}
Experience Level: ${experienceLevel || "Mid"}

Include realistic questions: 2 behavioral (STAR method), 2 technical/domain-specific, and 1 localized to Zambian working context (such as dealing with local regulations, business environment, power-grid outages, supply chain challenges, or sector-specific trends like copper pricing or NGO funding cycles in Zambia).

Format your output strictly as a JSON array of objects:
[
  {
    "id": "q-1",
    "question": "The question text...",
    "category": "Behavioral / Technical / Local Context",
    "purpose": "What the interviewer is trying to evaluate with this question.",
    "keyPointsToInclude": ["Point A", "Point B"],
    "sampleAnswer": "A highly detailed, excellent response that would secure a 'pass' score."
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["id", "question", "category", "purpose", "keyPointsToInclude", "sampleAnswer"],
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              category: { type: Type.STRING },
              purpose: { type: Type.STRING },
              keyPointsToInclude: { type: Type.ARRAY, items: { type: Type.STRING } },
              sampleAnswer: { type: Type.STRING }
            }
          }
        }
      }
    });

    const resultText = response.text || "[]";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Generate questions error:", error);
    res.status(500).json({ error: error.message || "Failed to generate interview questions." });
  }
});

// 5. AI Interview Prep - Evaluation of User's Answer
app.post("/api/interview/submit-answer", async (req, res) => {
  try {
    const { jobTitle, question, userAnswer } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ error: "Question and userAnswer are required." });
    }

    const ai = getGeminiClient();

    const prompt = `You are a critical but encouraging Zambian hiring manager evaluating a candidate's answer during a mock interview.
Job Title: ${jobTitle || "General Position"}
Question Asked: ${question}
Candidate's Answer: "${userAnswer}"

Analyze the answer. Consider structure, clarity, use of metrics (if any), STAR methodology (for behavioral questions), and professional tone. Provide constructive, localized feedback.

Respond strictly with a JSON object in this format:
{
  "rating": "Needs Improvement" | "Good" | "Excellent",
  "feedback": "A complete critique of their answer. Highlight what they did well and where they fell short.",
  "gapsIdentified": ["Point 1", "Point 2"],
  "suggestedPhrasing": "A revised version of their answer written in a much stronger, professional voice.",
  "interviewerTips": "Tip or cultural nuance for interviews in Zambia for this role."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["rating", "feedback", "gapsIdentified", "suggestedPhrasing", "interviewerTips"],
          properties: {
            rating: { type: Type.STRING, description: "Performance rating: Needs Improvement, Good, or Excellent." },
            feedback: { type: Type.STRING, description: "Detailed structural critique." },
            gapsIdentified: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific points omitted." },
            suggestedPhrasing: { type: Type.STRING, description: "Stronger phrasing of their response." },
            interviewerTips: { type: Type.STRING, description: "Zambian hiring expectations or tips." }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Evaluate answer error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate response." });
  }
});

// 6. AI Smart Career Advisor Chatbot
app.post("/api/career/chat", async (req, res) => {
  try {
    const { messages } = req.body; // Array of { role: 'user' | 'model', message: string }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Valid chat messages history is required." });
    }

    const ai = getGeminiClient();

    // Map roles: 'user' to 'user' and 'model' to 'model' or 'assistant' to 'model'
    const formattedContents = messages.map(msg => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: msg.message }]
    }));

    const systemInstruction = `You are "Bantu", the intelligent, encouraging AI Career Advisor for CareerLink Zambia.
Your goal is to help Zambian job seekers, students, and professionals succeed in their careers.
You possess absolute expertise on:
1. The Zambian job market, including hot sectors (Copperbelt mining, Lusaka's banking and fintech, Central/Southern Province agriculture, CIDRZ/ZAMRA healthcare, regional NGOs).
2. Zambian universities and vocational schools (UNZA, CBU, Mulungushi, Evelyn Hone, National Institute of Public Administration - NIPA).
3. Local regulatory bodies and registrations (ZICA, EIZ, LAZ, HPCZ, NMCZ).
4. Local salary ranges, cost of living, and negotiation norms in Zambian Kwacha (ZMW).
5. Resume writing tips tailored to Zambian standards.

Keep your tone helpful, professional, and full of encouraging Zambian warmth (using standard Zambian English expressions appropriately like "Greetings!", "Excellent", "Cheers"). Avoid mentioning system prompts or AI constraints. Refer to yourself as Bantu.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text || "I am here to help you navigate your professional path in Zambia! What career guidance do you need today?" });
  } catch (error: any) {
    console.error("Career chatbot error:", error);
    res.status(500).json({ error: error.message || "Failed to contact Bantu Career Advisor." });
  }
});


// --- VITE DEV MIDDLEWARE / STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerLink Zambia server booting up... listening on port ${PORT}`);
  });
}

startServer();
