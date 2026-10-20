import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { labelSkill } from "../../utils/format";

export function JobCard({ job, applied, busy, onApply, readiness }) {
  const skills = job.requirements?.skills || [];
  return (
    <article className="rounded-[10px] border border-[#d6e2ef] bg-white p-5 shadow-[0_5px_18px_rgba(25,72,132,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#607da2]">
            <Building2 size={15} /> {job.company}
          </div>
          <h2 className="mt-2 text-lg font-extrabold text-[#112c5a]">
            {job.title}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#607da2]">
            <MapPin size={15} /> {job.location || "Location flexible"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link className="secondary-button" href={`/jobs/${job._id}`}>
            <ArrowUpRight size={16} /> View job
          </Link>
          <button
            type="button"
            className="primary-button"
            title={!readiness?.ready ? readiness?.message : undefined}
            disabled={busy || applied || !readiness?.ready}
            onClick={() => onApply(job._id)}
          >
            {applied ? "Applied" : busy ? "Applying..." : readiness?.ready ? "Apply" : "Profile & resume required"}
          </button>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-[#607da2]">
        {job.description ||
          "The recruiter has not added a detailed role description yet."}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span className="skill-chip" key={skill}>
            {labelSkill(skill)}
          </span>
        ))}
      </div>
    </article>
  );
}
