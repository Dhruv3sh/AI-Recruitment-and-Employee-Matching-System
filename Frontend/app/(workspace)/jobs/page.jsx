"use client";

import { Search } from "lucide-react";
import { JobCard } from "../../../components/jobs/JobCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { RouteLoading } from "../../../components/ui/RouteLoading";
import { useCandidateJobs } from "../../../hooks/useCandidateJobs";

export default function JobsPage() {
  const workspace = useCandidateJobs();
  if (workspace.loading) return <RouteLoading label="Loading open roles..." />;

  return (
    <section>
      <p className="-mt-8 mb-7 text-sm text-[#617da4]">
        Search every open role and review the details before applying.
      </p>
      <label className="flex h-12 items-center gap-1 rounded-[10px] border border-[#cad9eb] bg-white px-4 shadow-[0_6px_18px_rgba(25,72,132,0.05)]">
        <Search size={19} className="text-[#56779f]" />
        <input
          className="border-0 bg-transparent shadow-none ring-0 focus:border-0 focus:ring-0"
          value={workspace.query}
          onChange={(event) => workspace.setQuery(event.target.value)}
          placeholder="Search by role, company, location, or skill"
          aria-label="Search open jobs"
        />
      </label>
      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Open opportunities</p>
          <h2 className="text-lg font-extrabold">Roles ready to explore</h2>
        </div>
        <span className="text-xs text-[#617da4]">
          {workspace.jobs.length} roles
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {workspace.jobs.length ? (
          workspace.jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              applied={workspace.appliedJobIds.includes(String(job._id))}
              busy={workspace.busyJobId === String(job._id)}
              onApply={workspace.applyForJob}
            />
          ))
        ) : (
          <EmptyState message="No open roles match your search." />
        )}
      </div>
    </section>
  );
}
