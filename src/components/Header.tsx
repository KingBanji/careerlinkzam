import { Briefcase, FileText, BrainCircuit, MessageSquare, PlusCircle, User, LogOut, Users, ShieldCheck, Info, Lock } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  savedJobsCount: number;
  user: { name: string; email: string; role: string } | null;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogoutClick: () => void;
  onAdminTriggerClick: () => void;
  onOpenAiSuite?: () => void;
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  savedJobsCount, 
  user, 
  onLoginClick, 
  onSignUpClick, 
  onLogoutClick,
  onAdminTriggerClick,
  onOpenAiSuite
}: HeaderProps) {
  const navItems: { id: string; label: string; icon: any; premium?: boolean }[] = [
    { id: "jobs", label: "Find Jobs", icon: Briefcase },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "post-job", label: "Post a Job", icon: PlusCircle },
    { id: "bantu", label: "Bantu AI Suite", icon: BrainCircuit },
    { id: "dashboard", label: "My Tracker", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-brand-border shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer" 
            onClick={() => setCurrentTab("jobs")}
            id="logo-container"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
            <div>
              <span className="text-xl font-display font-bold tracking-tight text-brand-green flex items-center">
                CareerLink<span className="text-brand-orange">Zambia</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdminTriggerClick();
                  }}
                  className="ml-2 p-1 text-slate-300 hover:text-brand-green bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-lg transition-all cursor-pointer"
                  title="Admin Portal Access"
                  id="secret-admin-trigger-logo"
                >
                  <Lock size={11} className="text-brand-green/75" />
                </button>
                <span className="ml-2 bg-brand-green/10 text-brand-green text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border border-brand-green/25 hidden sm:inline-block">
                  Professional
                </span>
              </span>
              <p className="text-[9px] text-brand-text-dim font-mono font-medium tracking-wide">Zambia's Professional Growth Hub</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1" id="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-bg-alt text-brand-green shadow-xs border border-brand-border"
                      : "text-brand-text-dim hover:text-brand-green hover:bg-brand-bg-alt/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-brand-green" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                  {item.premium && (
                    <span className="text-[9px] text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-full font-sans font-bold">
                      PRO
                    </span>
                  )}
                  {item.id === "dashboard" && savedJobsCount > 0 && (
                    <span className="bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                      {savedJobsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-3" id="user-auth-suite-container">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <span className="text-[9px] text-brand-text-dim block font-bold uppercase tracking-wider font-mono">
                    {user.role}
                  </span>
                  <span className="text-xs text-brand-text font-bold">
                    {user.name}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-brand-bg-alt border border-brand-border flex items-center justify-center text-brand-green font-extrabold text-xs shadow-xs uppercase">
                  {user.name.substring(0, 2)}
                </div>
                <button
                  onClick={onLogoutClick}
                  title="Sign Out"
                  className="p-2 rounded-lg text-brand-text-dim hover:text-brand-orange hover:bg-brand-bg-alt transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onLoginClick}
                  className="bg-brand-bg-alt hover:bg-brand-border text-brand-green border border-brand-border text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUpClick}
                  className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs transition-all cursor-pointer animate-pulse-subtle"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Subnavigation (Overflow bar) */}
        <div className="lg:hidden overflow-x-auto py-2 -mx-4 px-4 flex space-x-2 border-t border-gray-50 scrollbar-none" id="mobile-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-brand-bg-alt text-brand-text-dim hover:bg-brand-border"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.premium && (
                  <span className={`text-[8px] font-sans font-bold px-1.5 py-0.2 rounded-full ${isActive ? "bg-white text-brand-green" : "bg-brand-orange/10 text-brand-orange"}`}>
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
