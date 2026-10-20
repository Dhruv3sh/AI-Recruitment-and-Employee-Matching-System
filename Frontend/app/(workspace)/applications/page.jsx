"use client";

import { useMemo, useState } from "react";
import { Check, CircleX, Eye, FileText } from "lucide-react";
import { useRecruiterApplications } from "../../../hooks/useRecruiterApplications";
import { EmptyState } from "../../../components/ui/EmptyState";
import { RouteLoading } from "../../../components/ui/RouteLoading";
import { Score } from "../../../components/ui/Score";
import { initials, labelSkill } from "../../../utils/format";

const statusStyles = {
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ReceivedApplicationsPage() {
  const workspace = useRecruiterApplications();
  const [selectedJobId, setSelectedJobId] = useState("all");
  const jobs = useMemo(() => {
    const uniqueJobs = new Map();
    workspace.applications.forEach((application) => {
      if (application.job?._id) uniqueJobs.set(String(application.job._id), application.job);
    });
    return [...uniqueJobs.values()];
  }, [workspace.applications]);
  const applications = selectedJobId === "all"
    ? workspace.applications
    : workspace.applications.filter((application) => String(application.job?._id) === selectedJobId);
  if (workspace.loading) return <RouteLoading label="Loading received applications..." />;

  return (
    <section>
      <p className="-mt-8 mb-7 text-sm text-[#617da4]">Applications are ranked from highest to lowest match score across all of your open roles.</p>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-1">Candidate submissions</p><h2 className="text-lg font-extrabold">Review applications</h2></div><select className="max-w-full sm:w-[300px]" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} aria-label="Filter applications by job"><option value="all">All applications</option>{jobs.map((job) => <option key={job._id} value={job._id}>{job.title} · {job.company}</option>)}</select></div>
      <div className="grid gap-3">
        {applications.length ? applications.map((application, index) => (
          <ApplicationCard key={application._id} application={application} rank={selectedJobId === "all" ? null : index + 1} busy={workspace.busyId === application._id} onDecision={workspace.decide} onViewResume={workspace.viewResume} />
        )) : <EmptyState message="No candidates have applied to this role yet." />}
      </div>
    </section>
  );
}

function ApplicationCard({ application, rank, busy, onDecision, onViewResume }) {
  const profile = application.profileSnapshot;
  const job = application.job || {};
  const submitted = application.status === "submitted";
  return (
    <article className="relative rounded-[10px] border border-[#d6e2ef] bg-white p-5 shadow-[0_5px_18px_rgba(25,72,132,0.04)]">
      {rank ? <span className="absolute left-4 top-3 font-mono text-xs font-medium text-[#55749b]">#{rank}</span> : null}
      <div className={`grid gap-5 xl:grid-cols-[42px_minmax(180px,.8fr)_minmax(260px,1.2fr)_auto] xl:items-center ${rank ? "pt-5" : ""}`}>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-brand">{initials(profile.name)}</span>
        <div><h3 className="text-sm font-extrabold">{profile.name}</h3><p className="mt-1 text-xs text-[#617da4]">{profile.email}</p><p className="mt-1 text-xs text-[#617da4]">{profile.title || "Candidate"} · {profile.experience || 0} years</p></div>
        <div className="text-xs leading-relaxed text-[#55749b]"><p><strong className="text-ink">Applied for:</strong> {job.title || "Role unavailable"}{job.company ? ` · ${job.company}` : ""}</p><p className="mt-1"><strong className="text-ink">Skills:</strong> {profile.skills?.length ? profile.skills.map(labelSkill).join(", ") : "Not provided"}</p><p className="mt-1"><strong className="text-ink">Why it matched:</strong> {application.match?.explanation || "Matching details are being prepared."}</p></div>
        <Score value={application.match?.score || 0} />
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-[#e1eaf4] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase ${statusStyles[application.status] || statusStyles.submitted}`}>{application.status}</span>{application.resumeSnapshot ? <span className="flex items-center gap-1 text-xs text-[#607da2]"><FileText size={15} /> {application.resumeSnapshot.fileName}</span> : null}</div>
        <div className="flex flex-wrap gap-2">
          {application.hasResumeSnapshot ? <button type="button" className="secondary-button" onClick={() => onViewResume(application._id)}><Eye size={16} /> View resume</button> : application.resumeSnapshot ? <span className="text-xs text-slate-500">Resume snapshot unavailable</span> : null}
          {submitted ? <><button type="button" className="secondary-button border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busy} onClick={() => onDecision(application._id, "rejected")}><CircleX size={16} /> Reject</button><button type="button" className="primary-button" disabled={busy} onClick={() => onDecision(application._id, "accepted")}><Check size={16} /> {busy ? "Sending..." : "Accept"}</button></> : null}
        </div>
      </div>
    </article>
  );
}
