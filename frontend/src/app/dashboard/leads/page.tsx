"use client";

import { useEffect, useState } from "react";
import { api, Business, BusinessProfile } from "@/lib/api";

interface LeadRow {
  business: Business;
  profile: BusinessProfile | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBusinesses({ per_page: 100 });
        const rows: LeadRow[] = [];
        for (const biz of data.items) {
          let profile: BusinessProfile | null = null;
          try {
            profile = await api.getBusinessProfile(biz.id);
          } catch {}
          rows.push({ business: biz, profile });
        }
        rows.sort((a, b) => (b.profile?.opportunity_score || 0) - (a.profile?.opportunity_score || 0));
        setLeads(rows);
        if (rows.length > 0) setSelectedLead(rows[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Leads List Sidebar */}
      <aside className="w-80 bg-surface-container-low flex flex-col border-r border-outline-variant/10 shrink-0">
        <div className="p-5 border-b border-outline-variant/10">
          <h2 className="font-headline font-bold text-lg text-on-surface mb-1">Leads</h2>
          <p className="text-xs text-on-surface-variant">{leads.length} qualified leads</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {leads.map(({ business, profile }) => (
            <button
              key={business.id}
              onClick={() => setSelectedLead({ business, profile })}
              className={`w-full text-left p-4 border-b border-outline-variant/5 hover:bg-surface-container-high/50 transition-all ${
                selectedLead?.business.id === business.id ? "bg-surface-container-high" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="font-headline font-bold text-sm text-on-surface truncate">
                    {business.name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {business.category || "General"}
                  </p>
                </div>
                <div className="flex flex-col items-end ml-2">
                  <span className={`font-black text-lg leading-none ${
                    (profile?.opportunity_score || 0) >= 80 ? "text-tertiary" :
                    (profile?.opportunity_score || 0) >= 50 ? "text-primary" : "text-on-surface-variant"
                  }`}>
                    {profile?.opportunity_score ?? "--"}
                  </span>
                </div>
              </div>
              {profile && (
                <div className="mt-2">
                  <StatusBadge status={profile.lead_status} />
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Lead Profile Detail */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-12 pt-8 pb-12 bg-surface-dim">
        {selectedLead ? (
          <LeadProfile lead={selectedLead} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-on-surface-variant">Select a lead to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadProfile({ lead }: { lead: LeadRow }) {
  const { business, profile } = lead;
  const score = profile?.opportunity_score || 0;
  const scorePercent = Math.min(score, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant tracking-wider uppercase">
        <a className="hover:text-primary transition-colors" href="/dashboard/leads">Leads</a>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-on-surface">{business.name}</span>
      </div>

      {/* Main Profile Card */}
      <div className="bg-surface-container-low rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-6">
              <div className="w-20 h-20 bg-surface-container-highest rounded-2xl flex items-center justify-center p-4">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                  domain
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
                    {business.name}
                  </h2>
                  {profile && <StatusBadge status={profile.lead_status} large />}
                </div>
                <p className="text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {business.address || "Unknown location"} {business.category ? `\u2022 ${business.category}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="p-2 rounded-xl bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all">
                <span className="material-symbols-outlined">star</span>
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Summary + Tech */}
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
                  Intelligence Summary
                </h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  {profile?.ai_summary || "No intelligence summary available yet. Enrich this business to generate AI-powered insights about their operations, market position, and opportunity potential."}
                </p>
              </section>

              {profile?.tech_stack && profile.tech_stack.detected.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                    Technology Detected
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.tech_stack.detected.map((tech) => (
                      <div key={tech} className="bg-surface-container-highest px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-on-surface">
                        <span className="material-symbols-outlined text-blue-400 text-base">code</span>
                        {tech}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Contact Info */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {business.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">phone</span>
                      <span className="text-on-surface">{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">mail</span>
                      <span className="text-on-surface">{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">language</span>
                      <a href={business.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right: Score + Features */}
            <div className="space-y-8">
              {/* Opportunity Score */}
              <div className="bg-surface-container-high rounded-3xl p-6 flex items-center justify-between gap-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(from 0deg, #b4c5ff 0%, #b4c5ff ${scorePercent}%, #2d3449 ${scorePercent}%, #2d3449 100%)`,
                    }}
                  >
                    <div className="w-[88%] h-[88%] bg-surface-container-high rounded-full flex items-center justify-center">
                      <span className="text-3xl font-headline font-black text-on-surface">{score}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-headline font-bold text-on-surface">Opportunity Score</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {score >= 80
                      ? "High conversion probability. Contact this week."
                      : score >= 50
                      ? "Moderate potential. Nurture with content."
                      : "Low priority. Monitor for changes."}
                  </p>
                  <div className="mt-4 flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-full rounded-full ${
                          i < Math.ceil(score / 25) ? "bg-primary" : "bg-outline-variant/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Features */}
              {profile && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                    Business Signals
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <SignalCard icon="calendar_month" label="Online Booking" active={profile.has_online_booking} />
                    <SignalCard icon="smart_toy" label="Chatbot" active={profile.has_chatbot} />
                    <SignalCard icon="search" label="SEO Score" value={profile.seo_score ? `${profile.seo_score}/100` : undefined} active={!!profile.seo_score} />
                    <SignalCard icon="schedule" label="Enriched" active={!!profile.enriched_at} />
                  </div>
                </section>
              )}

              {/* Social Links */}
              {profile && (profile.facebook_url || profile.instagram_url || profile.tiktok_url) && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                    Social Footprint
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {profile.instagram_url && (
                      <SocialCard icon="photo_camera" label="Instagram" url={profile.instagram_url} color="text-pink-400" />
                    )}
                    {profile.facebook_url && (
                      <SocialCard icon="thumb_up" label="Facebook" url={profile.facebook_url} color="text-blue-400" />
                    )}
                    {profile.tiktok_url && (
                      <SocialCard icon="music_note" label="TikTok" url={profile.tiktok_url} color="text-cyan-400" />
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 flex gap-4 pt-8 border-t border-outline-variant/10">
            <button className="flex-1 gradient-primary text-on-primary-fixed py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Execute Outreach
            </button>
            <button
              onClick={async () => {
                try {
                  const blob = await api.exportCsv(business.territory_id ? { territory_id: business.territory_id } : {});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "geointel_export.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) { console.error(err); }
              }}
              className="px-6 py-3 border border-outline-variant/20 rounded-xl font-bold uppercase tracking-wider text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button
              onClick={() => {
                const params: Record<string, string | number> = {};
                if (business.territory_id) params.territory_id = business.territory_id;
                const url = api.exportPdfUrl(params);
                window.open(url, "_blank");
              }}
              className="px-6 py-3 border border-outline-variant/20 rounded-xl font-bold uppercase tracking-wider text-sm text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const styles: Record<string, string> = {
    hot: "bg-error-container/30 text-error",
    warm: "bg-secondary/10 text-secondary",
    cold: "bg-outline-variant/20 text-on-surface-variant",
  };
  return (
    <span className={`${styles[status] || styles.cold} ${large ? "px-3 py-1" : "px-2 py-0.5"} rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 w-fit`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "hot" ? "bg-error animate-pulse" : status === "warm" ? "bg-secondary" : "bg-outline-variant"}`} />
      {status}
    </span>
  );
}

function SignalCard({ icon, label, active, value }: { icon: string; label: string; active: boolean; value?: string }) {
  return (
    <div className={`p-4 rounded-2xl flex flex-col items-center text-center ${active ? "bg-surface-container-highest" : "bg-surface-container-high/50"}`}>
      <span className={`material-symbols-outlined mb-2 ${active ? "text-tertiary" : "text-on-surface-variant/40"}`}>
        {icon}
      </span>
      <span className={`text-xs font-bold ${active ? "text-on-surface" : "text-on-surface-variant/40"}`}>
        {value || (active ? "Yes" : "No")}
      </span>
      <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function SocialCard({ icon, label, url, color }: { icon: string; label: string; url: string; color: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="bg-surface-container-highest p-4 rounded-2xl flex flex-col items-center text-center hover:bg-surface-bright transition-colors"
    >
      <span className={`material-symbols-outlined ${color} mb-2`}>{icon}</span>
      <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{label}</span>
    </a>
  );
}
