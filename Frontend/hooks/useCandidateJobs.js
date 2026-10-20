"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { getApplicationReadiness } from "../utils/applicationReadiness";

export function useCandidateJobs() {
  const { session, endSession } = useWorkspaceSession();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState("");
  const [readiness, setReadiness] = useState({ ready: false, message: "Checking application requirements..." });

  const handleError = useCallback((error) => {
    if (isUnauthorizedError(error)) {
      toast.error("Your session has expired. Please sign in again.");
      endSession();
      return;
    }
    toast.error(error.message);
  }, [endSession]);

  const load = useCallback(async () => {
    const [jobResult, applicationResult, profileResult, resumeResult] = await Promise.all([
      apiRequest("/jobs", { token: session.token }),
      apiRequest("/applications", { token: session.token }),
      apiRequest("/profile/me", { token: session.token }),
      apiRequest("/resumes", { token: session.token }),
    ]);
    setJobs(jobResult.jobs || []);
    setAppliedJobIds((applicationResult.applications || []).map((item) => String(item.job)));
    setReadiness(getApplicationReadiness(profileResult.user.profile, resumeResult.resumes || []));
  }, [session.token]);

  useEffect(() => {
    load().catch(handleError).finally(() => setLoading(false));
  }, [handleError, load]);

  async function applyForJob(jobId) {
    if (!readiness.ready) {
      toast.error(readiness.message);
      return;
    }
    setBusyJobId(String(jobId));
    try {
      const result = await apiRequest("/applications", {
        token: session.token,
        method: "POST",
        body: { jobId },
      });
      setAppliedJobIds((current) => [...new Set([...current, String(jobId)])]);
      toast.success(result.message);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyJobId("");
    }
  }

  const filteredJobs = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return jobs;
    return jobs.filter((job) => [
      job.title,
      job.company,
      job.location,
      job.description,
      ...(job.requirements?.skills || []),
    ].join(" ").toLowerCase().includes(search));
  }, [jobs, query]);

  return { query, setQuery, jobs: filteredJobs, loading, busyJobId, appliedJobIds, applyForJob, readiness };
}
