import React, { useState, useEffect } from "react";
import { Newspaper, TrendingUp, ExternalLink, Clock, RefreshCw, AlertCircle, Compass, HelpCircle } from "lucide-react";

interface Article {
  title: string;
  summary: string;
  category: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
}

interface KeyTrend {
  trend: string;
  implication: string;
  gainingMomentum: boolean;
}

interface NewsTrendsResponse {
  lastUpdated: string;
  articles: Article[];
  keyTrends: KeyTrend[];
}

export default function CareerNewsTrends() {
  const [data, setData] = useState<NewsTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNewsTrends = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await fetch("/api/career/news-trends");
      if (!res.ok) {
        throw new Error("Unable to retrieve market trends.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Error fetching news & trends:", err);
      setError("Failed to fetch current intelligence. Please refresh or try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNewsTrends();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "mining":
        return "bg-amber-100 text-amber-900 border-amber-200/50";
      case "tech":
        return "bg-sky-100 text-sky-900 border-sky-200/50";
      case "ngos":
        return "bg-purple-100 text-purple-900 border-purple-200/50";
      case "financial services":
      case "finance":
        return "bg-emerald-100 text-emerald-900 border-emerald-200/50";
      case "agriculture":
        return "bg-lime-100 text-lime-900 border-lime-200/50";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200/50";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xs animate-pulse space-y-6" id="career-news-loading">
        <div className="flex justify-between items-center pb-4 border-b border-gray-150">
          <div className="h-6 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded-md" />
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-2xl space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                <div className="h-3 w-full bg-gray-100 rounded-md" />
                <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-4 w-24 bg-gray-200 rounded-md" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 text-center space-y-3" id="career-news-error">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-red-950">Market Intelligence Unavailable</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => fetchNewsTrends(true)}
          className="inline-flex items-center space-x-1.5 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[11px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Fetch</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="career-news-trends-section">
      {/* Dynamic Header Banner */}
      <div className="bg-slate-900 text-white px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4.5 w-4.5 text-brand-orange" />
            <h2 className="font-display font-black text-sm uppercase tracking-wider text-white">
              Zambian Live Career Intelligence
            </h2>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
            Grounding Source: Real-time Google Search • Updated {data?.lastUpdated || "Recently"}
          </p>
        </div>

        <button
          onClick={() => fetchNewsTrends(true)}
          disabled={refreshing}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-widest py-2 px-3.5 rounded-xl transition-all flex items-center space-x-1.5 border border-white/10 cursor-pointer disabled:opacity-50"
          id="btn-refresh-trends"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Grounding..." : "Sync Live News"}</span>
        </button>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Latest News Stories */}
          <div className="lg:col-span-7 space-y-5" id="news-stories-column">
            <div className="flex items-center space-x-2">
              <Newspaper className="h-4 w-4 text-brand-green" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-brand-green">
                Latest Employment Developments
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data?.articles && data.articles.length > 0 ? (
                data.articles.map((article, idx) => (
                  <div
                    key={idx}
                    className="group bg-slate-50 hover:bg-brand-bg-alt/30 border border-gray-100 hover:border-brand-green/20 rounded-2xl p-4 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <div className="flex items-center space-x-1 text-[9px] text-gray-400 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{article.date}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-brand-green transition-colors">
                        {article.title}
                      </h4>

                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between text-[9px]">
                      <span className="text-gray-400 font-mono">Source: <strong className="text-gray-600">{article.sourceName}</strong></span>
                      {article.sourceUrl && article.sourceUrl.startsWith("http") && (
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-brand-orange hover:text-brand-orange-light font-bold transition-all"
                        >
                          <span>Read Source</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No current articles found.</p>
              )}
            </div>
          </div>

          {/* Right Column: Local Job Market Trends */}
          <div className="lg:col-span-5 space-y-5" id="market-trends-column">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-brand-orange" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-brand-orange">
                Critical Market Shifts
              </h3>
            </div>

            <div className="space-y-4">
              {data?.keyTrends && data.keyTrends.length > 0 ? (
                data.keyTrends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="bg-brand-bg-alt/20 border border-brand-border rounded-2xl p-4 space-y-2.5 relative overflow-hidden"
                  >
                    {trend.gainingMomentum && (
                      <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Rising Fast
                      </span>
                    )}

                    <div className="space-y-0.5 max-w-[85%]">
                      <h4 className="text-xs font-bold text-brand-green leading-snug">
                        {trend.trend}
                      </h4>
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 border border-brand-border/60">
                      <span className="block text-[8px] font-mono uppercase font-black text-brand-orange tracking-widest mb-1">
                        What this means for you
                      </span>
                      <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
                        {trend.implication}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No trends parsed currently.</p>
              )}

              {/* Local Advisory Note */}
              <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-4 flex items-start space-x-3">
                <Compass className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-brand-green uppercase tracking-wider">
                    Bantu Advisor Tip
                  </span>
                  <p className="text-[10px] text-brand-green/90 leading-relaxed font-medium">
                    "Zambian employers are placing extreme emphasis on official local licensing (ZICA, EIZ, HPCZ) this season. Ensure these credentials stand out in your resume header."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
