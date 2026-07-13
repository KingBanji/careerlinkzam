import React from "react";
import { Info, MapPin, Award, CheckCircle2, Phone, Mail, Building2, Globe } from "lucide-react";

export default function AboutUs() {
  const values = [
    {
      title: "Direct Access",
      description: "We bypass costly middlemen to connect job seekers directly with hiring managers at top-tier organizations.",
      icon: Award
    },
    {
      title: "Zambian Compliance",
      description: "Fully compliant with local labor guidelines, ZICA finance rules, EIZ engineering registrations, and HPCZ licensing.",
      icon: CheckCircle2
    },
    {
      title: "Nationwide Coverage",
      description: "Driving professional excellence and recruitment across all 10 provinces — from Solwezi's copper belt to Livingstone's shores.",
      icon: MapPin
    }
  ];

  const partners = [
    "Zanaco Bank PLC", "MTN Zambia", "Airtel Money", "First National Bank", "Liquid Intelligent Technologies", "Kansanshi Copper Mining"
  ];

  return (
    <div className="space-y-12 py-4" id="about-us-container">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-brand-green overflow-hidden shadow-sm text-white p-8 md:p-14" id="about-hero">
        <div className="absolute top-0 right-0 h-48 w-48 bg-brand-orange/10 rounded-full blur-2xl" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="inline-block font-mono text-brand-orange-light text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
            About CareerLink Zambia
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight leading-tight">
            Zambia's Premier Professional Growth Hub
          </h1>
          <p className="text-sm md:text-base text-brand-bg-alt/90 leading-relaxed max-w-2xl">
            Established to drive professional transparency, CareerLink Zambia is the official bridge connecting the nation's brightest talents with premium corporate employers. We operate on a direct-to-recruiter standard with zero middlemen.
          </p>
        </div>
      </div>

      {/* Values & Core Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="about-values-grid">
        {values.map((val, idx) => {
          const Icon = val.icon;
          return (
            <div key={idx} className="bg-white border border-brand-border rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="p-2.5 bg-brand-bg-alt text-brand-green rounded-xl inline-block">
                <Icon size={20} />
              </div>
              <h3 className="text-base font-bold text-brand-green">{val.title}</h3>
              <p className="text-xs text-brand-text-dim leading-relaxed">{val.description}</p>
            </div>
          );
        })}
      </div>

      {/* Corporate Information & Contacts split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="about-details-section">
        {/* Company Overview */}
        <div className="lg:col-span-7 bg-white border border-brand-border rounded-2xl p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold text-brand-green">Our Story & Vision</h2>
            <p className="text-xs text-brand-text-dim leading-relaxed">
              Founded in Lusaka, CareerLink Zambia was born out of a simple realization: the traditional job search process was fragmented. Talented Zambian graduates, engineers, accountants, and medical professionals struggled to connect directly with hiring corporate entities.
            </p>
            <p className="text-xs text-brand-text-dim leading-relaxed">
              By integrating robust digital authentication and Google Workspace channels, we allow job seekers to transmit application portfolios directly to verified corporate email lists with the click of a button. Furthermore, our cutting-edge Bantu Career AI suite helps candidates refine resumes and run customized interview simulation prep for any role.
            </p>
          </div>

          <div className="pt-4 border-t border-brand-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text font-mono">Affiliated Networks & Partners</h4>
            <div className="flex flex-wrap gap-2">
              {partners.map((p, idx) => (
                <span key={idx} className="bg-brand-bg-alt border border-brand-border px-3 py-1 rounded-full text-[10px] font-bold text-brand-green">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact and Headquarters block */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white space-y-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 h-32 w-32 bg-brand-orange/5 rounded-full blur-xl" />
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">Contact Our Office</h3>
            <p className="text-xs text-slate-400">
              For corporate premium plans, job posting contracts, or administrative inquiries, reach out directly to our Lusaka team.
            </p>
          </div>

          <div className="space-y-4 text-xs relative z-10">
            <div className="flex items-start space-x-3">
              <MapPin className="text-brand-orange shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-200">Headquarters Address</p>
                <p className="text-slate-400">Level 4, Zanaco House, Cairo Road</p>
                <p className="text-slate-400">Lusaka, Zambia</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="text-brand-orange shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-200">Email Enquiries</p>
                <a href="mailto:support@careerlinkjobzambia.com" className="text-brand-green hover:underline">
                  support@careerlinkjobzambia.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="text-brand-orange shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-200">Corporate Hotline</p>
                <p className="text-slate-400">+260 971 123456</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Globe className="text-brand-orange shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-200">Canonical Website</p>
                <a href="https://www.careerlinkjobzambia.com" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
                  www.careerlinkjobzambia.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
