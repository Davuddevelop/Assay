"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { saveOnboarding } from "@/app/(app)/onboarding/actions";
import { PLATFORMS, AUDIENCES } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/**
 * Two questions, one screen, one button.
 *
 * Not a multi-step wizard and not a modal. A wizard turns two questions into
 * four screens and a progress bar; a modal makes the first thing a new account
 * sees a wall between them and the product. This sits at the top of the
 * dashboard, above the work, and disappears once answered.
 *
 * Both questions are optional in the sense that nothing is blocked if they are
 * skipped — but neither is pre-selected, because a default that quietly
 * becomes the answer for anyone who doesn't read is worse than no data. The
 * button stays disabled until both are chosen, so the only two outcomes are a
 * real answer or a deliberate skip.
 *
 * Native radios, visually replaced. The `peer` styling means keyboard
 * navigation, arrow keys within the group, focus rings and screen-reader
 * announcement are the browser's, not a reimplementation — which is where
 * hand-built chip groups usually fail.
 */
export function OnboardingQuestions() {
  const [platform, setPlatform] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const ready = platform !== null && audience !== null;

  return (
    <form
      action={saveOnboarding}
      className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6 sm:p-8"
    >
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
        Two questions
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-ivory">
        So the next screen is the right one.
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ivory-dim">
        That&rsquo;s all we ask — no company size, no job title. Both answers
        change what Assay shows you.
      </p>

      <Question
        legend="What do you build with?"
        name="platform"
        options={PLATFORMS}
        selected={platform}
        onSelect={setPlatform}
      />
      <Question
        legend="Who is it for?"
        name="audience"
        options={AUDIENCES}
        selected={audience}
        onSelect={setAudience}
      />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SubmitButton
          variant="primary"
          size="md"
          disabled={!ready}
          pendingText="Saving…"
        >
          Continue
        </SubmitButton>
        {/* A real skip, not a hidden one. Someone who won't answer will find a
            way past regardless; the honest version costs one button and keeps
            the data we do collect meaningful — a forced field's worst outcome
            isn't a blank, it's whichever option is nearest the mouse. */}
        <SubmitButton
          variant="ghost"
          size="md"
          name="skip"
          value="1"
          pendingText="Skipping…"
        >
          Skip
        </SubmitButton>
      </div>
    </form>
  );
}

function Question({
  legend,
  name,
  options,
  selected,
  onSelect,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <fieldset className="mt-8">
      <legend className="text-sm font-medium text-ivory">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={selected === o.value}
              onChange={() => onSelect(o.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-9 items-center rounded-[var(--radius-control)] border px-4 text-sm transition-colors",
                "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-gold)]",
                selected === o.value
                  ? "border-ivory bg-ivory text-onyx"
                  : "border-border text-ivory-dim hover:border-border-strong hover:text-ivory",
              )}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
