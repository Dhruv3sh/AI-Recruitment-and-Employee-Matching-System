"use client";

import { Sparkles } from "lucide-react";
import { Field } from "../ui/Field";

export function JobForm({
  job,
  onChange,
  onSubmit,
  busy = false,
  submitLabel,
  onGenerateDescription,
  generatingDescription = false,
}) {
  const update = (field, value) => onChange({ ...job, [field]: value });

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <Field label="Job title">
        <input
          value={job.title}
          onChange={(event) => update("title", event.target.value)}
          required
        />
      </Field>
      <Field label="Company">
        <input
          value={job.company}
          onChange={(event) => update("company", event.target.value)}
          required
        />
      </Field>
      <Field label="Location">
        <input
          value={job.location}
          onChange={(event) => update("location", event.target.value)}
        />
      </Field>
      <Field label="Minimum experience">
        <input
          type="number"
          min="0"
          value={job.experience}
          onChange={(event) => update("experience", event.target.value)}
        />
      </Field>
      <Field label="Education" full>
        <input
          value={job.education}
          onChange={(event) => update("education", event.target.value)}
          placeholder="For example: B.Tech, MCA, or equivalent experience"
        />
      </Field>
      <Field label="Required skills" hint="Separate skills with commas" full>
        <textarea
          rows="2"
          value={job.skills}
          onChange={(event) => update("skills", event.target.value)}
          required
        />
      </Field>
      <Field label="Job description" hint="Review every AI draft before publishing" full>
        <textarea
          rows="8"
          value={job.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </Field>
      <div className="col-span-full flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="secondary-button w-full sm:w-auto"
          disabled={busy || generatingDescription}
          onClick={onGenerateDescription}
        >
          <Sparkles size={16} />
          {generatingDescription ? "Generating draft..." : "Generate job description"}
        </button>
        <button className="primary-button w-full sm:w-auto" disabled={busy || generatingDescription}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
