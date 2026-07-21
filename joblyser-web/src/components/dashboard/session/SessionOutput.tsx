import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import {
  ACTION_BADGE_MAP,
  getBadge,
} from "@/components/dashboard/session/badges";
import type { SessionResponse } from "@/types";

interface SessionOutputProps {
  activeSession: SessionResponse | null;
  isLoading: boolean;
  activeAction: string | null;
  onTriggerAction: (actionId: string, label: string) => void;
  onUpdateSession: (session: SessionResponse) => void;
}

export default function SessionOutput({
  activeSession,
  isLoading,
  activeAction,
  onTriggerAction,
  onUpdateSession,
}: SessionOutputProps) {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Agent is working...</p>
        <p className="text-zinc-600 text-xs mt-1">Running {activeAction}</p>
      </div>
    );
  }

  if (!activeSession || !activeSession.agent_result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 h-full">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-zinc-400 text-base font-medium">
          Run an action to see your results
        </h2>
        <p className="text-zinc-600 text-sm mt-2">
          Use the action bar below to analyse your resume against this job.
        </p>
      </div>
    );
  }

  const session = activeSession;
  const result = session.agent_result;
  if (!result) return null;

  const reviewData = result.type === "review" ? result.role_fit : null;
  const companyInfo = result.type === "review" ? result.search_company : null;
  const coverLetterData =
    result.type === "cover_letter" ? result.cover_letter : null;
  const linkedinData =
    result.type === "linkedin_note" ? result.linkedin_note : null;
  const coldMailData = result.type === "cold_mail" ? result.cold_mail : null;

  let copyText = "";

  if (coverLetterData) {
    const header = coverLetterData.header;
    const body = coverLetterData.body;
    const signOff = coverLetterData.sign_off;
    copyText =
      coverLetterData.edited_text ||
      [
        `${header.candidate_name}\n${header.email || ""}\n${header.date}\n`,
        "Dear Hiring Manager,",
        body.paragraph_1_hook,
        body.paragraph_2_proof,
        body.paragraph_3_company_fit,
        body.paragraph_4_complete_picture,
        body.paragraph_5_cta,
        `${signOff.closing}\n${signOff.candidate_name}`,
      ]
        .filter(Boolean)
        .join("\n\n");
  } else if (linkedinData) {
    copyText = linkedinData.edited_text || linkedinData.note;
  } else if (coldMailData) {
    copyText = coldMailData.edited_text || coldMailData.email_body;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>{getBadge(result.type)}</div>
        <div className="flex gap-2">
          <button
            onClick={() => handleCopy(copyText)}
            className="border border-zinc-700 rounded-xl p-2 text-zinc-400 hover:border-zinc-500 hover:text-white transition-all outline-none"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              onTriggerAction(
                result.type,
                ACTION_BADGE_MAP[result.type]?.label || "Action",
              )
            }
            className="border border-zinc-700 rounded-xl p-2 text-zinc-400 hover:border-zinc-500 hover:text-white transition-all outline-none"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {reviewData && (
        <div className="space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold text-base">
                Role Fit
              </span>
              {(() => {
                const d = reviewData.decision;
                const bdg =
                  d === "Apply"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : d === "Consider"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20";
                return (
                  <span
                    className={`border rounded-full px-3 py-1 text-sm font-medium ${bdg}`}
                  >
                    {d}
                  </span>
                );
              })()}
            </div>
            <div className="flex flex-col items-center justify-center my-6">
              <div className="h-48 w-48 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={10}
                    data={[
                      {
                        name: "Score",
                        value: reviewData.match_score,
                        fill:
                          reviewData.match_score >= 80
                            ? "#fbbf24"
                            : reviewData.match_score >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: "#27272a" }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-bold text-white">
                    {reviewData.match_score}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-zinc-400 text-sm text-center max-w-md mx-auto">
              {reviewData.role_fit_summary}
            </p>

            <div className="mt-8 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                  data={[
                    {
                      name: "Req. Skills",
                      matched: reviewData.comparison_breakdown.required_matched,
                      total: reviewData.comparison_breakdown.required_total,
                    },
                    {
                      name: "Pref. Skills",
                      matched:
                        reviewData.comparison_breakdown.preferred_matched,
                      total: reviewData.comparison_breakdown.preferred_total,
                    },
                    {
                      name: "Resp.",
                      matched:
                        reviewData.comparison_breakdown
                          .responsibilities_matched,
                      total:
                        reviewData.comparison_breakdown.responsibilities_total,
                    },
                    {
                      name: "Soft Skills",
                      matched:
                        reviewData.comparison_breakdown.soft_skills_matched,
                      total: reviewData.comparison_breakdown.soft_skills_total,
                    },
                  ]}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <XAxis type="number" hide domain={[0, "dataMax"]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    width={80}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#27272a" }}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fbbf24" }}
                  />
                  <Bar dataKey="matched" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {[
                      {
                        matched:
                          reviewData.comparison_breakdown.required_matched,
                        total: reviewData.comparison_breakdown.required_total,
                      },
                      {
                        matched:
                          reviewData.comparison_breakdown.preferred_matched,
                        total: reviewData.comparison_breakdown.preferred_total,
                      },
                      {
                        matched:
                          reviewData.comparison_breakdown
                            .responsibilities_matched,
                        total:
                          reviewData.comparison_breakdown
                            .responsibilities_total,
                      },
                      {
                        matched:
                          reviewData.comparison_breakdown.soft_skills_matched,
                        total:
                          reviewData.comparison_breakdown.soft_skills_total,
                      },
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.matched === entry.total
                            ? "#10b981"
                            : entry.matched > 0
                              ? "#fbbf24"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              {(() => {
                const c = reviewData.confidence;
                const cColor =
                  c === "High"
                    ? "text-emerald-400"
                    : c === "Medium"
                      ? "text-amber-400"
                      : "text-red-400";
                return (
                  <span className={`text-xs ${cColor}`}>Confidence: {c}</span>
                );
              })()}
            </div>
          </div>

          {companyInfo && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">
                About the Company
              </h3>
              {companyInfo.summary && (
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  {companyInfo.summary}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {companyInfo.industry && (
                  <span className="bg-zinc-800 text-zinc-300 text-xs rounded-full px-3 py-1">
                    {companyInfo.industry}
                  </span>
                )}
                {companyInfo.culture && (
                  <span className="bg-zinc-800 text-zinc-300 text-xs rounded-full px-3 py-1">
                    {companyInfo.culture}
                  </span>
                )}
              </div>
              {companyInfo.products && companyInfo.products.length > 0 && (
                <div className="mt-4">
                  <span className="text-zinc-500 text-xs mb-2 block">
                    Products / Services
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {companyInfo.products.map((product) => (
                      <span
                        key={product}
                        className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs rounded-full px-3 py-1"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-emerald-400 text-xs font-medium mb-2">
                    ✅ Opportunities
                  </h4>
                  <ul className="text-zinc-400 text-sm space-y-1">
                    {(companyInfo.opportunities || []).map((opportunity, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 text-xs font-medium mb-2">
                    ⚠️ Risks
                  </h4>
                  <ul className="text-zinc-400 text-sm space-y-1">
                    {(companyInfo.risks || []).map((risk, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {reviewData.matched_requirements.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-white font-semibold">
                  Matched Requirements
                </h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs rounded-full px-2.5 py-0.5 font-medium">
                  {reviewData.matched_requirements.length}
                </span>
              </div>
              <div>
                {reviewData.matched_requirements.map((req, i) => {
                  const c =
                    req.match_strength === "strong"
                      ? "emerald"
                      : req.match_strength === "partial"
                        ? "amber"
                        : "zinc";
                  return (
                    <div
                      key={i}
                      className="border-b border-zinc-800 py-3 last:border-none"
                    >
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <span className="text-zinc-300 text-sm font-medium flex-1">
                          {req.requirement}
                        </span>
                        <span
                          className={`bg-${c}-500/10 text-${c}-400 border border-${c}-500/20 text-xs rounded-full px-2 py-0.5 whitespace-nowrap`}
                        >
                          {req.match_strength}
                        </span>
                      </div>
                      <span className="text-zinc-600 text-xs inline-block mr-2 font-mono uppercase">
                        {req.requirement_type}
                      </span>
                      <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                        {req.evidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reviewData.unmatched_requirements.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-white font-semibold">Gaps to Close</h3>
                <span className="bg-red-500/10 text-red-400 text-xs rounded-full px-2.5 py-0.5 font-medium">
                  {reviewData.unmatched_requirements.length}
                </span>
              </div>
              <div>
                {reviewData.unmatched_requirements.map((req, i) => {
                  const icolor =
                    req.importance === "critical"
                      ? "text-red-400"
                      : req.importance === "important"
                        ? "text-amber-400"
                        : "text-zinc-400";
                  return (
                    <div
                      key={i}
                      className="border-b border-zinc-800 py-4 last:border-none"
                    >
                      <div className="text-zinc-300 text-sm font-medium">
                        {req.requirement}
                      </div>
                      <div
                        className={`text-xs mt-1 font-mono uppercase ${icolor}`}
                      >
                        {req.importance}
                      </div>
                      <div className="text-zinc-500 text-xs mt-1">
                        {req.why_unmatched}
                      </div>
                      <div className="bg-zinc-800 rounded-lg px-3 py-2 mt-2 flex gap-2 items-start">
                        <span className="text-sm">💡</span>
                        <span className="text-zinc-400 text-xs leading-relaxed">
                          {req.action_to_close_gap}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reviewData.recommended_actions_before_applying.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">
                Before You Apply
              </h3>
              <div>
                {reviewData.recommended_actions_before_applying.map(
                  (act, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start mb-3 last:mb-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {act}
                      </p>
                    </div>
                  ),
                )}
              </div>
              {reviewData.must_have_gaps.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-6">
                  <h4 className="text-red-400 text-sm font-semibold mb-2 flex items-center gap-2">
                    🚨 Critical Gaps
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewData.must_have_gaps.map((gap, i) => (
                      <span
                        key={i}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full px-3 py-1"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {coverLetterData && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-4">
            {coverLetterData.edited_text ? (
              <>
                <div className="text-amber-400 text-xs font-medium mb-4 flex items-center gap-1.5">
                  <span className="text-base">✏️</span> Edited version
                </div>
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {coverLetterData.edited_text}
                </div>
              </>
            ) : (
              <>
                <div className="text-white text-xl font-bold">
                  {coverLetterData.header.candidate_name}
                </div>
                <div className="flex gap-4 flex-wrap text-zinc-400 text-sm mt-1">
                  {coverLetterData.header.email && (
                    <span>{coverLetterData.header.email}</span>
                  )}
                  {coverLetterData.header.phone && (
                    <span>{coverLetterData.header.phone}</span>
                  )}
                  {coverLetterData.header.linkedin_url && (
                    <span>{coverLetterData.header.linkedin_url}</span>
                  )}
                  {coverLetterData.header.github_url && (
                    <span>{coverLetterData.header.github_url}</span>
                  )}
                </div>
                <div className="text-right text-zinc-500 text-sm mt-3">
                  {coverLetterData.header.date}
                </div>
                <div className="border-b border-zinc-700 mt-4 mb-6" />
                <div className="text-zinc-300 text-sm mb-4">
                  Dear Hiring Manager,
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {coverLetterData.body.paragraph_1_hook}
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {coverLetterData.body.paragraph_2_proof}
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {coverLetterData.body.paragraph_3_company_fit}
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {coverLetterData.body.paragraph_4_complete_picture}
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {coverLetterData.body.paragraph_5_cta}
                </p>
                <div className="text-zinc-300 text-sm mt-6 mb-1">
                  {coverLetterData.sign_off.closing}
                </div>
                <div className="text-zinc-300 text-sm font-medium">
                  {coverLetterData.sign_off.candidate_name}
                </div>
              </>
            )}
          </div>

          {editMode ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-80 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl p-4 focus:outline-none focus:border-amber-400 resize-y"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const mutatedData = {
                      ...coverLetterData,
                      edited_text: editText,
                    };
                    onUpdateSession({
                      ...session,
                      agent_result: {
                        type: "cover_letter",
                        cover_letter: mutatedData,
                      },
                    });
                    setEditMode(false);
                  }}
                  className="bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-300 transition-all border border-transparent"
                >
                  Save Edit
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditText(copyText);
                setEditMode(true);
              }}
              className="border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-all font-medium"
            >
              Edit Cover Letter
            </button>
          )}
        </div>
      )}

      {linkedinData && (
        <div className="max-w-xl mx-auto space-y-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">
                🤝 LinkedIn Connection Note
              </h3>
              {(() => {
                const len = linkedinData.edited_text
                  ? linkedinData.edited_text.length
                  : linkedinData.character_count;
                const c =
                  len <= 300
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-red-400 bg-red-500/10 border-red-500/20";
                return (
                  <span
                    className={`border text-xs rounded-full px-3 py-0.5 ${c}`}
                  >
                    {len} / 300 chars
                  </span>
                );
              })()}
            </div>
            <div className="mb-4 space-y-1">
              <div className="text-zinc-500 text-sm">
                To:{" "}
                <span className="text-zinc-300">
                  {linkedinData.recruiter_name || "Recruiter"}
                </span>
              </div>
              <div className="text-zinc-500 text-sm">
                Role:{" "}
                <span className="text-zinc-300">
                  {linkedinData.role_title} at {linkedinData.company_name}
                </span>
              </div>
            </div>

            {!linkedinData.edited_text && (
              <div className="bg-zinc-800 rounded-xl px-4 py-3 mb-3">
                <div className="text-amber-400 text-xs uppercase tracking-widest mb-1">
                  Hook
                </div>
                <div className="text-zinc-300 text-sm">{linkedinData.hook}</div>
              </div>
            )}

            <div className="bg-zinc-800 rounded-xl px-4 py-3">
              {linkedinData.edited_text ? (
                <div className="text-amber-400 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <span>✏️</span> Edited note
                </div>
              ) : (
                <div className="text-zinc-500 text-xs uppercase tracking-widest mb-2 border-b border-zinc-700 pb-2">
                  Full Message
                </div>
              )}
              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {linkedinData.edited_text || linkedinData.note}
              </div>
            </div>
          </div>

          {editMode ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-40 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl p-4 focus:outline-none focus:border-amber-400 resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-zinc-500">
                  {editText.length} / 300
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const mutatedData = {
                        ...linkedinData,
                        edited_text: editText,
                        character_count: editText.length,
                      };
                      onUpdateSession({
                        ...session,
                        agent_result: {
                          type: "linkedin_note",
                          linkedin_note: mutatedData,
                        },
                      });
                      setEditMode(false);
                    }}
                    className="bg-amber-400 text-black px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-amber-300 transition-all border border-transparent"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-zinc-400 hover:text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditText(copyText);
                  setEditMode(true);
                }}
                className="border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-all font-medium"
              >
                Edit Note
              </button>
            </div>
          )}
        </div>
      )}

      {coldMailData && (
        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-base">
              📧 Cold Email
            </h3>

            <div className="bg-zinc-800 rounded-xl px-4 py-3 mb-4">
              <div className="text-zinc-500 text-xs uppercase tracking-widest">
                Subject
              </div>
              <div className="text-white text-base font-semibold mt-1">
                {coldMailData.subject}
              </div>
            </div>

            <div className="border-b border-zinc-800 mb-4" />

            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {coldMailData.edited_text ? (
                <>
                  <div className="text-amber-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                    <span>✏️</span> Edited
                  </div>
                  {coldMailData.edited_text}
                </>
              ) : (
                coldMailData.email_body
              )}
            </div>
          </div>

          {editMode ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-64 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl p-4 focus:outline-none focus:border-amber-400 resize-y"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const mutatedData = {
                      ...coldMailData,
                      edited_text: editText,
                    };
                    onUpdateSession({
                      ...session,
                      agent_result: {
                        type: "cold_mail",
                        cold_mail: mutatedData,
                      },
                    });
                    setEditMode(false);
                  }}
                  className="bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-300 transition-all border border-transparent"
                >
                  Save Edit
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditText(copyText);
                setEditMode(true);
              }}
              className="border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-all font-medium"
            >
              Edit Email
            </button>
          )}
        </div>
      )}
    </div>
  );
}
