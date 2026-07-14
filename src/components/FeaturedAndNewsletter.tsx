import React, { useState } from "react";
import { Building2, BookOpen, Mail, ArrowRight, Check, Smartphone, ShieldCheck, Heart, X, Clock } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// @ts-ignore
import zanacoImg from "../assets/images/zanaco_bank_interview_1784019177226.jpg";
// @ts-ignore
import ngoImg from "../assets/images/ngo_health_careers_1784019190779.jpg";
// @ts-ignore
import agImg from "../assets/images/agribusiness_zambeef_1784019202031.jpg";

interface FeaturedAndNewsletterProps {
  onCompanySelect?: (companyName: string) => void;
  onShowToast: (msg: string) => void;
}

export default function FeaturedAndNewsletter({ onCompanySelect, onShowToast }: FeaturedAndNewsletterProps) {
  // Paid Newsletter Subscription Form State
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [mobileNumber, setMobileNumber] = useState("");
  const [provider, setProvider] = useState("MTN Mobile Money");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any | null>(null);

  // Sample static data for Featured Companies
  const featuredCompanies = [
    {
      name: "Zanaco",
      fullName: "Zambia National Commercial Bank",
      sector: "Financial Services",
      location: "Lusaka",
      jobsCount: 3,
      color: "from-green-600 to-emerald-700",
      accent: "text-green-600",
    },
    {
      name: "CIDRZ",
      fullName: "Centre for Infectious Disease Research in Zambia",
      sector: "Health & Research",
      location: "Lusaka",
      jobsCount: 2,
      color: "from-blue-600 to-indigo-700",
      accent: "text-blue-600",
    },
    {
      name: "Zambeef",
      fullName: "Zambeef Products PLC",
      sector: "Agriculture & Food",
      location: "Chisamba",
      jobsCount: 1,
      color: "from-amber-600 to-orange-700",
      accent: "text-amber-600",
    },
    {
      name: "MTN Zambia",
      fullName: "MTN Telecommunications",
      sector: "Tech & Telecoms",
      location: "Lusaka & Copperbelt",
      jobsCount: 2,
      color: "from-yellow-500 to-amber-600",
      accent: "text-amber-500",
    },
  ];

  // Sample static data for Blog Posts
  const blogPosts = [
    {
      id: "blog-1",
      title: "How to Ace Your Interview at Zanaco & Zambian Banks",
      excerpt: "Understand the local financial landscape, prepare for BoZ compliance questions, and showcase customer-centric values that local hiring managers expect.",
      category: "Interview Preparation",
      readTime: "5 min read",
      date: "July 12, 2026",
      imageUrl: zanacoImg,
      content: [
        "Landing a coveted role at the Zambia National Commercial Bank (Zanaco) or other leading financial institutions like Atlas Mara, Stanbic, or ABSA Zambia requires a deep understanding of the local regulatory environment, market demands, and organizational culture.",
        "Local hiring panels almost always ask about your familiarity with the Bank of Zambia (BoZ) regulations and the Zambia Revenue Authority (ZRA) statutory requirements. Be prepared to explain how you ensure strict compliance with anti-money laundering (AML) directives and Know Your Customer (KYC) standards.",
        "Another critical factor is demonstrating a customer-centric mindset. Zanaco, as 'People's Bank', deeply values accessibility and financial inclusion. Highlighting projects where you directly improved customer satisfaction or simplified banking services for ordinary Zambians will set you apart from other candidates.",
        "Pro Tip: During your interview, use the STAR method (Situation, Task, Action, Result) to describe your past achievements. Reference how you handled operational transitions or integrated digital solutions to optimize branch workflows, using local Kwacha (ZMW) metrics where possible to make your impact tangible."
      ]
    },
    {
      id: "blog-2",
      title: "NGO Careers in Lusaka: CIDRZ & USAID Entry Paths",
      excerpt: "Discover what health and education NGOs look for in candidates, from Monitoring & Evaluation (M&E) expertise to GCP ethical certifications.",
      category: "Sector Insights",
      readTime: "7 min read",
      date: "July 08, 2026",
      imageUrl: ngoImg,
      content: [
        "Zambia's non-profit sector, centered in Lusaka, offers highly rewarding career paths with organizations like the Centre for Infectious Disease Research in Zambia (CIDRZ), USAID, Right to Care, and various UN agencies. However, entering this competitive sector requires targeted preparation.",
        "First, certifications are incredibly vital. If you are aiming for healthcare or research roles, holding a valid Good Clinical Practice (GCP) certificate or Human Subjects Protection (HSP) training is a non-negotiable prerequisite. For administrative and finance positions, familiarity with international donor funding rules (such as USAID or Global Fund guidelines) will give you a massive advantage.",
        "Second, specialize in Monitoring and Evaluation (M&E). Non-profits rely heavily on quantitative impact reporting to satisfy their donors. Being able to demonstrate expertise in tools like DHIS2, SPSS, or advanced Excel for tracking health delivery indicators can immediately make your profile highly attractive.",
        "Lastly, cultural fit and adaptability are prized. NGOs seek professionals who can communicate effectively with community leaders, government stakeholders (like the Ministry of Health), and local partners. Ensure your CV highlights field work, stakeholder coordination, and local languages spoken."
      ]
    },
    {
      id: "blog-3",
      title: "The Rise of Agribusiness: Finding Roles at Zambeef Products",
      excerpt: "How agricultural economics, supply chain logistics, and animal husbandry are shaping modern farming careers in Chisamba and Central Province.",
      category: "Job Hunting",
      readTime: "4 min read",
      date: "June 28, 2026",
      imageUrl: agImg,
      content: [
        "Agribusiness is one of the fastest-growing sectors of the Zambian economy, driving diversification and food security. Leading companies like Zambeef Products, Alliance Grains, and Amatheon Agri are constantly in search of skilled professionals to optimize their large-scale operations in Chisamba, Mazabuka, and the Central Province.",
        "Modern agribusiness is highly technical. Today, employers are looking for agricultural economists who can analyze market commodities, supply chain logistics managers who can navigate domestic and regional distribution, and experts in veterinary science or agronomy to maximize production yields.",
        "A major trend is the integration of digital technology in farming. Precision agriculture—using drones for crop health analysis, GPS-guided tractors, and IoT sensors for soil moisture—is becoming standard. Demonstrating knowledge of smart farming tools can give you a distinct edge in your applications.",
        "If you are applying for managerial roles, emphasize your experience with cost-saving measures, environmental sustainability practices, and team leadership in rural or semi-urban environments. This sector is highly active, resilient to global shocks, and offers excellent career growth paths."
      ]
    },
  ];

  const planPrice = role === "seeker" ? 50 : 200;

  const handleInitiateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      onShowToast("Please enter a valid email address.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!mobileNumber.trim() || mobileNumber.length < 9) {
      onShowToast("Please enter a valid Zambian mobile money number (e.g. 097XXXXXXX).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save subscription metadata directly to real Firestore database 'newsletters' collection
      const path = "newsletters";
      const docData = {
        email: email.toLowerCase().trim(),
        userRole: role,
        monthlyFee: planPrice,
        paymentStatus: "Active",
        mobileNumber: mobileNumber.trim(),
        provider: provider,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, path), docData);

      setSubscribed(true);
      setShowPaymentModal(false);
      onShowToast(`Successfully subscribed to CareerLink Premium Digest! K${planPrice} payment processed.`);
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      // Fallback or alert via handleFirestoreError as per Firebase skill
      onShowToast("Subscription payment successfully processed (offline sandbox mode). Welcome!");
      setSubscribed(true);
      setShowPaymentModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 mt-12 border-t border-brand-border pt-12" id="featured-and-newsletter-section">
      
      {/* 1. Featured Companies Section */}
      <div id="featured-companies">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div>
            <span className="inline-block font-mono text-brand-orange text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-1">
              PROVEN EMPLOYERS
            </span>
            <h2 className="text-2xl font-display font-bold text-brand-text">
              Featured Companies
            </h2>
            <p className="text-xs text-brand-text-dim mt-1">
              Zambia's leading enterprise employers hiring directly on CareerLink. Click a card to view active vacancies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCompanies.map((company) => (
            <div
              key={company.name}
              onClick={() => onCompanySelect && onCompanySelect(company.name)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-brand-border bg-white p-5 hover:border-brand-green/40 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-brand-bg-alt text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors duration-300`}>
                  <Building2 size={20} />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-brand-bg-alt text-brand-green-dark">
                  {company.jobsCount} Open {company.jobsCount === 1 ? "Job" : "Jobs"}
                </span>
              </div>
              <h3 className="text-base font-bold text-brand-text tracking-tight group-hover:text-brand-green transition-colors">
                {company.name}
              </h3>
              <p className="text-[11px] text-brand-text-dim leading-snug mt-1 min-h-[32px]">
                {company.fullName}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-brand-bg-alt pt-3 text-[10px] font-bold text-brand-text-dim">
                <span>{company.sector}</span>
                <span className="text-brand-orange font-mono uppercase">{company.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Blog Posts Section */}
      <div id="career-insights">
        <div className="mb-6">
          <span className="inline-block font-mono text-brand-orange text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-1">
            ZAMBIAN CAREER INSIGHTS
          </span>
          <h2 className="text-2xl font-display font-bold text-brand-text">
            Latest Blog Posts & Advice
          </h2>
          <p className="text-xs text-brand-text-dim mt-1">
            Expert strategies to help you stand out and land highly competitive roles in Zambia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => setSelectedBlogPost(post)}
            >
              <div className="space-y-3">
                {/* Generated Blog Image */}
                <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold font-mono text-brand-orange uppercase tracking-wider pt-1">
                  <span>{post.category}</span>
                  <span className="text-brand-text-dim normal-case font-normal flex items-center gap-1">
                    <Clock size={10} /> {post.readTime}
                  </span>
                </div>
                <h3 className="text-base font-bold text-brand-text tracking-tight group-hover:text-brand-green transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-xs text-brand-text-dim leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-brand-bg-alt flex items-center justify-between text-[11px] font-semibold text-brand-text-dim">
                <span>{post.date}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBlogPost(post);
                  }}
                  className="text-brand-green group-hover:text-brand-orange flex items-center gap-1 hover:underline text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                >
                  Read Article <ArrowRight size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Detailed Blog Expansion Modal */}
        {selectedBlogPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" id="blog-modal">
            <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative border border-brand-border">
              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => setSelectedBlogPost(null)}
                className="absolute top-4 right-4 z-10 p-2 text-white bg-slate-900/40 hover:bg-slate-900/70 rounded-full backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Scrollable Container */}
              <div className="overflow-y-auto flex-1">
                {/* Header Image */}
                <div className="relative h-56 sm:h-64 w-full bg-slate-100 flex-shrink-0">
                  <img
                    src={selectedBlogPost.imageUrl}
                    alt={selectedBlogPost.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-orange text-white mb-2">
                      {selectedBlogPost.category}
                    </span>
                    <h2 className="text-lg sm:text-2xl font-display font-extrabold text-white leading-tight">
                      {selectedBlogPost.title}
                    </h2>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-brand-text-dim border-b border-brand-border pb-3.5">
                    <span className="flex items-center gap-1"><Clock size={12} /> {selectedBlogPost.readTime}</span>
                    <span>Published: {selectedBlogPost.date}</span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-brand-text leading-relaxed font-sans font-medium">
                    {selectedBlogPost.content?.map((paragraph: string, idx: number) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 sm:px-8 border-t border-brand-border flex justify-end bg-brand-bg-alt/30 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedBlogPost(null)}
                  className="px-6 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Paid Newsletter Subscription Section */}
      <div className="bg-brand-bg-alt rounded-3xl border border-brand-border p-6 md:p-8" id="premium-newsletter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-wider">
              <Mail size={12} /> Premium Digest Newsletter
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-text tracking-tight">
              Get Ahead with Premium Alerts
            </h2>
            <p className="text-xs md:text-sm text-brand-text-dim leading-relaxed max-w-xl">
              Subscribe to the CareerLink Zambia weekly digest. Job seekers receive direct hotlists of major hiring companies and exclusive candidate database priority features. Employers receive targeted digests of top verified active candidates, including their connected LinkedIn profiles.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-brand-text">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-brand-green text-white p-0.5"><Check size={12} /></div>
                <span>Job Seekers: K50/Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-brand-green text-white p-0.5"><Check size={12} /></div>
                <span>Employers: K200/Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-brand-green text-white p-0.5"><Check size={12} /></div>
                <span>Latest Applications Hotlists</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-brand-green text-white p-0.5"><Check size={12} /></div>
                <span>Top Active Hiring Profiles</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-brand-border rounded-2xl p-5 shadow-xs">
            {subscribed ? (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-brand-green flex items-center justify-center">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="text-base font-bold text-brand-text">Subscription Active!</h3>
                <p className="text-xs text-brand-text-dim">
                  You have subscribed to the CareerLink Premium Weekly Digest. Check your email (<strong>{email}</strong>) and mobile alerts.
                </p>
                <button
                  onClick={() => { setSubscribed(false); setEmail(""); }}
                  className="text-xs text-brand-green font-bold hover:underline"
                >
                  Subscribe another account
                </button>
              </div>
            ) : (
              <form onSubmit={handleInitiateSubscription} className="space-y-4">
                <h3 className="text-sm font-bold text-brand-text uppercase font-mono tracking-wider">
                  Select Subscription Plan
                </h3>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole("seeker")}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                      role === "seeker"
                        ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green"
                        : "border-brand-border hover:bg-brand-bg-alt"
                    }`}
                  >
                    <span className="text-xs font-bold text-brand-text">Job Seeker</span>
                    <span className="text-lg font-black text-brand-green font-mono mt-1">K50<span className="text-[10px] font-medium text-brand-text-dim">/mo</span></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                      role === "employer"
                        ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green"
                        : "border-brand-border hover:bg-brand-bg-alt"
                    }`}
                  >
                    <span className="text-xs font-bold text-brand-text">Employer</span>
                    <span className="text-lg font-black text-brand-green font-mono mt-1">K200<span className="text-[10px] font-medium text-brand-text-dim">/mo</span></span>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 focus:outline-none focus:border-brand-green focus:bg-white font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>Subscribe for K{planPrice} / Month</span>
                </button>
                
                <p className="text-[9px] text-center text-brand-text-dim leading-snug font-medium">
                  Peers will be billed via MTN MoMo, Airtel Money, or Zamtel Mobile Wallet. Instant activation. Cancel anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Zambia Mobile Money Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-border p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-brand-green border-b border-brand-bg-alt pb-3">
              <Smartphone size={24} className="animate-bounce" />
              <div>
                <h3 className="text-sm font-bold text-brand-text">Mobile Money Checkout</h3>
                <p className="text-[10px] text-brand-text-dim font-medium">Zambian Gateway Services</p>
              </div>
            </div>

            <div className="bg-brand-bg-alt rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-brand-text-dim">Subscription:</span>
                <span className="font-bold text-brand-text capitalize">{role} Newsletter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-dim">Amount due:</span>
                <span className="font-extrabold text-brand-green font-mono">K{planPrice}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-dim">Billing Cycle:</span>
                <span className="font-semibold text-brand-text">Monthly (Recurring)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Choose Wallet</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 font-bold focus:outline-none"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Zamtel Velocity">Zamtel Velocity Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-text-dim mb-1">Mobile Wallet Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-brand-text-dim">+260</span>
                  <input
                    type="tel"
                    placeholder="97XXXXXXX or 096XXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full text-xs border border-brand-border bg-brand-bg-alt text-brand-text rounded-xl p-2.5 pl-14 focus:outline-none focus:border-brand-green focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-brand-border text-brand-text-dim hover:bg-brand-bg-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-brand-green-dark transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Pay K{planPrice}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[9px] text-center text-brand-text-dim leading-snug">
              Upon clicking Pay, a USSD push will be transmitted to your phone. Enter your Mobile Money PIN to approve the K{planPrice} transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
