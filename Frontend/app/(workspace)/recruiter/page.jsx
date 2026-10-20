"use client";

import { RouteLoading } from "../../../components/ui/RouteLoading";
import { useRecruiterWorkspace } from "../../../hooks/useRecruiterWorkspace";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Field } from "../../../components/ui/Field";
import { PanelHeading } from "../../../components/ui/PanelHeading";
import { Score } from "../../../components/ui/Score";
import { initials, labelSkill } from "../../../utils/format";

export default function RecruiterPage() {
  const workspace = useRecruiterWorkspace();
  const update = (field, value) => workspace.setJobForm({ ...workspace.jobForm, [field]: value });
  if (workspace.loading) return <RouteLoading label="Loading recruiter desk..." />;
  return (
    <>
      <section>
      <p className="-mt-8 mb-7 text-sm text-[#617da4]">Create structured roles, then review transparent candidate signals and applications.</p>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.9fr)]">
        <section className="panel p-6 sm:p-7">
          <PanelHeading
            eyebrow="Job management"
            title="Publish a role"
          />
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={workspace.createJob}
          >
            <Field label="Job title">
              <input
                value={workspace.jobForm.title}
                onChange={(event) => update("title", event.target.value)}
                required
              />
            </Field>
            <Field label="Company">
              <input
                value={workspace.jobForm.company}
                onChange={(event) => update("company", event.target.value)}
                required
              />
            </Field>
            <Field label="Location">
              <input
                value={workspace.jobForm.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </Field>
            <Field label="Minimum experience">
              <input
                type="number"
                min="0"
                value={workspace.jobForm.experience}
                onChange={(event) => update("experience", event.target.value)}
              />
            </Field>
            <Field
              label="Required skills"
              hint="Separate skills with commas"
              full
            >
              <textarea
                rows="2"
                value={workspace.jobForm.skills}
                onChange={(event) => update("skills", event.target.value)}
                required
              />
            </Field>
            <Field label="Job description" full>
              <textarea
                rows="3"
                value={workspace.jobForm.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Field>
            <button className="primary-button" disabled={workspace.busy}>
              {workspace.busy ? "Publishing..." : "Parse and publish"}
            </button>
          </form>
        </section>
        <MatchingGuide />
      </div>
      <section className="mt-9">
        <div className="mb-4 grid gap-3 sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-1">Candidate recommendations</p>
            <h2 className="text-lg font-bold">Matches for open roles</h2>
          </div>
          <select
            className="max-w-sm"
            value={workspace.selectedJob}
            onChange={(event) => workspace.setSelectedJob(event.target.value)}
            aria-label="Choose an open job"
          >
            {workspace.jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} · {job.company}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3">
          {workspace.matches.length ? (
            workspace.matches.map((match) => (
              <CandidateMatch key={match._id} match={match} />
            ))
          ) : (
            <EmptyState message="Publish a job to see its candidate shortlist." />
          )}
        </div>
      </section>
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Applications</p>
            <h2 className="text-lg font-bold">Profiles sent by candidates</h2>
          </div>
          <span className="text-xs text-slate-500">
            {workspace.applications.length} received
          </span>
        </div>
        <div className="grid gap-3">
          {workspace.applications.length ? (
            workspace.applications.map((application) => (
              <CandidateApplication
                key={application._id}
                application={application}
                onViewResume={workspace.viewCandidateResume}
              />
            ))
          ) : (
            <EmptyState message="No candidates have applied to this role yet." />
          )}
        </div>
      </section>
    </section>
    </>
  );
}

function MatchingGuide() {
  const signals = [
    ["60", "Skills", "Demonstrated capability overlap"],
    ["25", "Experience", "Fit with the role target"],
    ["15", "Education", "Relevant degree or training signal"],
  ];
  return (
        <section className="panel border-emerald-100 bg-[#effbf6] p-6 sm:p-7">
      <p className="eyebrow mb-1">How matching works</p>
      <h2 className="text-xl font-bold">
        Transparent scoring, better judgment.
      </h2>
      <ol className="mt-6 grid gap-3">
        {signals.map(([score, label, detail]) => (
          <li key={label} className="flex items-center gap-3">
            <b className="grid h-8 w-8 place-items-center rounded bg-emerald-100 font-mono text-[11px] font-medium text-emerald-700">
              {score}
            </b>
            <span>
              <strong className="block text-xs">{label}</strong>
              <small className="text-[10px] text-emerald-800/70">
                {detail}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-emerald-200 pt-4 text-xs leading-relaxed text-emerald-900/80">
        Shortlists are recommendations. Recruiters review every candidate before
        deciding.
      </p>
    </section>
  );
}

function CandidateMatch({ match }) {
  const candidate = match.candidate;
  return (
    <article className="grid gap-4 rounded-[9px] border border-[#d6e2ef] bg-white p-5 sm:grid-cols-[42px_minmax(140px,.7fr)_minmax(180px,1.5fr)_55px] sm:items-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-xs font-extrabold text-orange-700">
        {initials(candidate.name)}
      </span>
      <div>
        <h3 className="text-sm font-bold">{candidate.name}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {candidate.profile.title || "Candidate"} ·{" "}
          {candidate.profile.location || "Location not set"}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">
        <strong className="mb-1 block text-ink">Match explanation</strong>
        {match.explanation}
        {match.missingSkills.length ? (
          <em className="mt-1 block not-italic text-amber-700">
            Growth area: {labelSkill(match.missingSkills[0])}
          </em>
        ) : null}
      </p>
      <Score value={match.score} />
    </article>
  );
}

function CandidateApplication({ application, onViewResume }) {
  const profile = application.profileSnapshot;
  return (
    <article className="grid gap-4 rounded-[9px] border border-[#d6e2ef] bg-white p-5 sm:grid-cols-[42px_minmax(180px,.8fr)_minmax(220px,1.2fr)] sm:items-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-brand">
        {initials(profile.name)}
      </span>
      <div>
        <h3 className="text-sm font-bold">{profile.name}</h3>
        <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
        <p className="mt-1 text-xs text-slate-500">
          {profile.title || "Candidate"} · {profile.experience || 0} years
        </p>
      </div>
      <div className="text-xs leading-relaxed text-slate-600">
        <p><strong className="text-ink">Education:</strong> {profile.education || "Not provided"}</p>
        <p className="mt-1"><strong className="text-ink">Skills:</strong> {profile.skills.length ? profile.skills.map(labelSkill).join(", ") : "Not provided"}</p>
        {application.resumeSnapshot ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
            <p>
              <strong className="text-ink">Resume:</strong> {application.resumeSnapshot.fileName}
            </p>
            {application.resume ? (
              <button
                type="button"
                className="secondary-button text-xs"
                onClick={() => onViewResume(application.resume)}
              >
                View resume
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
