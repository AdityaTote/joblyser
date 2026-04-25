"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/text-area";

export type SessionResultType =
  | "review"
  | "cover_letter"
  | "cold_mail"
  | "linkedin_note";

export interface SessionResult {
  type: SessionResultType;
  title: string;
  score: number;
  highlights: string[];
  draft: string;
}

interface AgentResultRendererProps {
  result: SessionResult;
}

export function AgentResultRenderer({ result }: AgentResultRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(result.draft);

  const displayedDraft = isEditing ? draftText : result.draft;

  const wordCount = useMemo(() => {
    const trimmed = displayedDraft.trim();
    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }, [displayedDraft]);

  return (
    <section className="surface-card rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Generated Output
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{result.title}</h3>
        </div>
        <Badge variant="default">Score {result.score}%</Badge>
      </div>

      <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-[rgb(var(--surface)/0.6)]">
        <div
          className="h-full rounded-full bg-[rgb(var(--accent))]"
          style={{ width: `${result.score}%` }}
        />
      </div>

      <ul className="mb-6 grid gap-2 sm:grid-cols-2">
        {result.highlights.map((item) => (
          <li
            key={item}
            className="surface-soft rounded-xl px-3 py-2 text-sm text-muted"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Draft</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{wordCount} words</span>
          <Button
            variant={isEditing ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsEditing((prev) => {
                const next = !prev;
                if (next) {
                  setDraftText(result.draft);
                }
                return next;
              });
            }}
          >
            {isEditing ? "Preview" : "Edit"}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Textarea
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          className="min-h-72"
        />
      ) : (
        <div className="surface-soft rounded-2xl p-4">
          <p className="whitespace-pre-wrap text-sm leading-7">
            {displayedDraft}
          </p>
        </div>
      )}
    </section>
  );
}
