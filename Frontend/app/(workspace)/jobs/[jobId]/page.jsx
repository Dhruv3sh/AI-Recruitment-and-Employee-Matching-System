"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  MapPin,
  Sparkles,
  Timer,
  WandSparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError } from "../../../../lib/api";
import { useWorkspaceSession } from "../../../../components/layout/WorkspaceContext";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { RouteLoading } from "../../../../components/ui/RouteLoading";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { labelSkill } from "../../../../utils/format";
import { getApplicationReadiness } from "../../../../utils/applicationReadiness";

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const { session, endSession } = useWorkspaceSession();
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coach, setCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(true);
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [readiness, setReadiness] = useState({ ready: false, message: "Checking application requirements..." });

  const handleError = useCallback(
    (requestError) => {
      if (isUnauthorizedError(requestError)) {
        toast.error("Your session has expired. Please sign in again.");
        endSession();
        return;
      }
      setError(requestError.message);
    },
    [endSession],
  );

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      apiRequest(`/jobs/${jobId}`, { token: session.token }),
      apiRequest("/applications", { token: session.token }),
      apiRequest("/profile/me", { token: session.token }),
      apiRequest("/resumes", { token: session.token }),
    ])
      .then(([jobResult, applications, profileResult, resumeResult]) => {
        setJob(jobResult.job);
        setApplied(
          (applications.applications || []).some(
            (item) => String(item.job) === String(jobId),
          ),
        );
        setReadiness(getApplicationReadiness(profileResult.user.profile, resumeResult.resumes || []));
        apiRequest(`/matches/jobs/${jobId}/coach`, { token: session.token })
          .then((result) => setCoach(result))
          .catch(() => setCoach(null))
          .finally(() => setCoachLoading(false));
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [handleError, jobId, session.token]);

  async function apply() {
    if (!readiness.ready) {
      toast.error(readiness.message);
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest("/applications", {
        token: session.token,
        method: "POST",
        body: { jobId },
      });
      setApplied(true);
      toast.success(result.message);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setWithdrawPending(false);
    setBusy(true);
    try {
      const result = await apiRequest(`/applications/jobs/${jobId}`, {
        token: session.token,
        method: "DELETE",
      });
      setApplied(false);
      toast.success(result.message);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <RouteLoading label="Loading job details..." />;
  if (!job)
    return (
      <section>
        <Link className="secondary-button" href="/jobs">
          <ArrowLeft size={16} /> Back to jobs
        </Link>
        <div className="mt-6">
          <EmptyState message={error || "This job is no longer available."} />
        </div>
      </section>
    );

  return (
    <section>
      <Link className="secondary-button -mt-8 mb-7" href="/jobs">
        <ArrowLeft size={16} /> Back to jobs
      </Link>
      <article className="panel overflow-hidden">
        <div className="border-b border-[#dce7f3] bg-[#f8fbff] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="eyebrow mb-2">Open role</p>
              <h2 className="text-2xl font-extrabold text-[#102a57] sm:text-3xl">
                {job.title}
              </h2>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#55749b]">
                <Building2 size={18} /> {job.company}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="primary-button"
                title={!readiness.ready ? readiness.message : undefined}
                disabled={busy || applied || !readiness.ready}
                onClick={apply}
              >
                {applied
                  ? "Applied"
                  : busy
                    ? "Applying..."
                    : readiness.ready ? "Apply for this role" : "Profile & resume required"}
              </button>
              {applied ? (
                <button
                  type="button"
                  className="danger-button border border-rose-200 bg-white px-3"
                  disabled={busy}
                  onClick={() => setWithdrawPending(true)}
                >
                  Withdraw
                </button>
              ) : null}
            </div>
          </div>
          {!applied && !readiness.ready ? <p className="mt-4 text-xs text-amber-700">{readiness.message}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#58779e]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2">
              <MapPin size={15} /> {job.location || "Location flexible"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2">
              <Timer size={15} /> {job.requirements?.experience || 0}+ years
              experience
            </span>
            {job.requirements?.education ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2">
                <GraduationCap size={15} /> {job.requirements.education}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(230px,.6fr)]">
          <div>
            <h3 className="text-base font-extrabold">About this role</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#54739a]">
              {job.description ||
                "The recruiter has not added a detailed description for this role."}
            </p>
          </div>
          <aside className="rounded-[10px] border border-[#dce7f3] bg-[#f8fbff] p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Lightbulb size={19} className="text-brand" /> Required skills
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(job.requirements?.skills || []).map((skill) => (
                <span className="skill-chip" key={skill}>
                  {labelSkill(skill)}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </article>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-violet-100 bg-[#f7f3ff] px-6 py-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[9px] text-violet-600">
                <Sparkles size={19} className="text-brand" />
              </span>
              <div>
                <p className="eyebrow text-violet-600">AI match system</p>
                <h2 className="text-base font-extrabold text-[#34225f]">
                  Ways to strengthen this match
                </h2>
              </div>
            </div>
            {coach?.score != null ? (
              <span className="rounded-full bg-white px-3 py-1.5 font-mono text-xs font-medium text-violet-700">
                Current match {coach.score}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="p-6 sm:p-7">
          {coachLoading ? (
            <p className="text-sm text-[#6d6793]">
              Reviewing your saved profile against this role...
            </p>
          ) : coach ? (
            <>
              <div className="rounded-[9px] border border-violet-100 bg-white px-4 py-3 text-xs leading-relaxed text-[#625d84]">
                <strong className="text-[#34225f]">Why it surfaced:</strong>{" "}
                {coach.explanation}
              </div>
              <p className="mt-4 max-w-3xl flex items-center gap-2 text-sm leading-6 ">
                <WandSparkles size={17} className="text-brand" />{" "}
                {coach.coach.summary}
              </p>

              {coach.coach.suggestions.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {coach.coach.suggestions.map((suggestion) => (
                    <article
                      key={suggestion.skill}
                      className="rounded-[9px] border border-violet-100 bg-[#fcfbff] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={17} className="text-violet-500" />
                        <strong className="text-sm text-[#302354]">
                          {labelSkill(suggestion.skill)}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-sm text-[#7b759b]">
                  All Skills Are Matched.
                </p>
              )}
              <p className="mt-5 text-[11px] leading-relaxed text-[#7b759b]">
                Only add a skill to your profile or resume when you can support
                it with genuine project, course, certification, or work
                evidence.
              </p>
            </>
          ) : (
            <p className="text-sm text-[#6d6793]">
              AI Suggestion is unavailable right now. The role&apos;s required
              skills above are still available for review.
            </p>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={withdrawPending}
        title="Withdraw this application?"
        description="The recruiter will no longer see your submitted candidate profile for this role. You can apply again later."
        confirmLabel="Withdraw application"
        cancelLabel="Keep application"
        onCancel={() => setWithdrawPending(false)}
        onConfirm={withdraw}
      />
    </section>
  );
}
