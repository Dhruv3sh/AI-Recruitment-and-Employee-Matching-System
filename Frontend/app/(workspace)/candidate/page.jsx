"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  FileText,
  GraduationCap,
  MapPin,
  Save,
  UploadCloud,
} from "lucide-react";
import { RouteLoading } from "../../../components/ui/RouteLoading";
import { useCandidateWorkspace } from "../../../hooks/useCandidateWorkspace";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Field } from "../../../components/ui/Field";
import { PanelHeading } from "../../../components/ui/PanelHeading";
import { Score } from "../../../components/ui/Score";
import { labelSkill } from "../../../utils/format";

export default function CandidatePage() {
  const update = (field, value) =>
    workspace.setProfile({ ...workspace.profile, [field]: value });
  const workspace = useCandidateWorkspace();
  const strongRecommendations = workspace.recommendations.filter(
    (match) => Number(match.score) >= 60,
  );

  if (workspace.loading)
    return <RouteLoading label="Loading candidate desk..." />;

  return (
    <>
      <section>
        <p className="-mt-6 mb-8 text-sm text-[#617da4]">
          Fill in your profile details to get better matching recommendations.
        </p>
        {/* <div className="mb-5 flex items-center gap-3 rounded-[9px] border border-blue-200 bg-[#f0f7ff] px-4 py-3 text-xs text-[#45658d]">
          <Info size={20} className="shrink-0 text-brand" />
          <strong className="text-brand">Phase 1 workspace</strong><span className="hidden h-4 w-px bg-blue-200 sm:block" />
          <span className="hidden sm:block">Recommendations are explainable signals for your review, not hiring decisions.</span>
        </div> */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.9fr)]">
          <section className="panel p-6 sm:p-7">
            <PanelHeading
              eyebrow="Candidate profile"
              title="Your matching signal"
            />
            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={workspace.saveProfile}
            >
              <Field label="Target role">
                <div className="field-input">
                  <BriefcaseBusiness size={18} className="text-[#5879a2]" />
                  <input
                    value={workspace.profile.title || ""}
                    onChange={(event) => update("title", event.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field label="Location">
                <div className="field-input">
                  <MapPin size={18} className="text-[#5879a2]" />
                  <input
                    value={workspace.profile.location || ""}
                    onChange={(event) => update("location", event.target.value)}
                  />
                </div>
              </Field>
              <Field label="Experience years">
                <div className="field-input">
                  <CalendarDays size={18} className="text-[#5879a2]" />
                  <input
                    type="number"
                    min="0"
                    value={workspace.profile.experience || 0}
                    onChange={(event) =>
                      update("experience", event.target.value)
                    }
                  />
                </div>
              </Field>
              <Field label="Education">
                <div className="field-input">
                  <GraduationCap size={18} className="text-[#5879a2]" />
                  <input
                    value={workspace.profile.education || ""}
                    onChange={(event) =>
                      update("education", event.target.value)
                    }
                  />
                </div>
              </Field>
              <Field label="Skills" hint="Separate skills with commas" full>
                <textarea
                  rows="3"
                  value={workspace.profile.skills || ""}
                  onChange={(event) => update("skills", event.target.value)}
                />
              </Field>
              <button
                className="primary-button sm:col-span-2"
                disabled={workspace.busy}
              >
                <Save size={17} />{" "}
                {workspace.busy ? "Saving..." : "Save profile"}
              </button>
            </form>
          </section>
          <section className="panel p-6 sm:p-7">
            <PanelHeading
              eyebrow="Resume processing"
              title="Make your experience searchable"
            />
            <label className="mt-6 grid min-h-56 cursor-pointer place-items-center content-center gap-2 rounded-[9px] border border-dashed border-[#c7d8ed] bg-[#f8fbff] p-5 text-center transition hover:border-brand hover:bg-blue-50">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-brand">
                <UploadCloud size={25} />
              </span>
              <strong className="text-sm">Upload your resume</strong>
              <small className="max-w-xs text-[11px] leading-relaxed text-slate-500">
                PDF, DOCX, TXT, and Markdown files are extracted in the
                background. Uploading a new file replaces your current resume.
              </small>
              <span className="secondary-button">
                <FileText size={16} /> Choose file
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={(event) => {
                  workspace.uploadResume(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong className="text-sm text-ink">Current resume</strong>
                <span className="text-xs text-slate-500">
                  {workspace.resumes.length}
                </span>
              </div>
              {workspace.resumes.length ? (
                <ul className="divide-y divide-[#e1eaf4]">
                  {workspace.resumes.map((resume) => (
                    <li
                      key={resume.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          size={23}
                          className="shrink-0 text-rose-500"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {resume.fileName}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {resume.parsingStatus === "complete"
                              ? "Processed"
                              : resume.parsingStatus === "failed"
                                ? "Needs attention"
                                : "Processing"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="secondary-button shrink-0"
                        onClick={() => workspace.viewResume(resume.id)}
                      >
                        <Eye size={15} /> View
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  No resume uploaded yet.
                </p>
              )}
            </div>
          </section>
        </div>
        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-1">Recommended for you</p>
              <h2 className="text-lg font-bold">Roles with strong alignment</h2>
            </div>
            <span className="text-xs text-slate-500">
              {strongRecommendations.length} open roles
            </span>
          </div>
          <div className="grid gap-3">
            {strongRecommendations.length ? (
              strongRecommendations.map((match) => (
                <JobRecommendation
                  key={match._id}
                  match={match}
                  busy={workspace.busy}
                  applied={workspace.appliedJobIds.includes(
                    String(match.job._id),
                  )}
                  onApply={workspace.applyForJob}
                  applicationReady={workspace.applicationReady}
                  applicationReadinessMessage={workspace.applicationReadinessMessage}
                />
              ))
            ) : (
              <EmptyState message="No roles currently meet the 60% recommendation threshold. Update your profile or explore all open jobs." />
            )}
          </div>
        </section>
      </section>
    </>
  );
}

function JobRecommendation({ match, busy, applied, onApply, applicationReady, applicationReadinessMessage }) {
  const job = match.job;
  return (
    <article className="grid gap-4 rounded-[9px] border border-[#d6e2ef] bg-white p-5 sm:grid-cols-[minmax(0,1fr)_72px_minmax(180px,1fr)_auto] sm:items-center">
      <div>
        <h3 className="text-sm font-bold">{job.title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {job.company} · {job.location || "Location flexible"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {match.matchedSkills.map((skill) => (
            <span key={skill} className="skill-chip">
              {labelSkill(skill)}
            </span>
          ))}
        </div>
      </div>
      <Score value={match.score} />
      <p className="text-xs leading-relaxed text-slate-600">
        <strong className="mb-1 block text-ink">Why it surfaced</strong>
        {match.explanation}
      </p>
      <div className="flex gap-2 sm:flex-col">
        <Link href={`/jobs/${job._id}`} className="secondary-button">
          <ArrowUpRight size={15} /> View
        </Link>
        <button
          type="button"
          className="primary-button"
          title={!applicationReady ? applicationReadinessMessage : undefined}
          disabled={busy || applied || !applicationReady}
          onClick={() => onApply(match.job._id)}
        >
          {applied ? "Applied" : applicationReady ? "Apply" : "Profile & resume required"}
        </button>
      </div>
    </article>
  );
}
