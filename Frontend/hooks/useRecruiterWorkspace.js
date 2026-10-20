"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError, openResumeFile } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { emptyJob } from "../utils/format";

export function useRecruiterWorkspace() {
  const { session, endSession } = useWorkspaceSession();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleRequestError = useCallback((error) => {
    if (isUnauthorizedError(error)) {
      toast.error("Your session has expired. Please sign in again.");
      endSession();
      return;
    }
    toast.error(error.message);
  }, [endSession]);

  const loadMatches = useCallback(async (jobId) => {
    if (!jobId || !session?.token) return;
    const [matchResult, applicationResult] = await Promise.all([
      apiRequest(`/matches/jobs/${jobId}`, { token: session.token }),
      apiRequest(`/applications/jobs/${jobId}`, { token: session.token }),
    ]);
    setMatches(matchResult.matches || []);
    setApplications(applicationResult.applications || []);
  }, [session]);

  const loadJobs = useCallback(async () => {
    const result = await apiRequest("/jobs", { token: session.token });
    const openJobs = result.jobs || [];
    setJobs(openJobs);
    setSelectedJob((current) => current && openJobs.some((job) => job._id === current) ? current : openJobs[0]?._id || "");
  }, [session]);

  useEffect(() => {
    loadJobs().catch(handleRequestError).finally(() => setLoading(false));
  }, [loadJobs, handleRequestError]);

  useEffect(() => {
    loadMatches(selectedJob).catch(handleRequestError);
  }, [selectedJob, loadMatches, handleRequestError]);

  async function createJob(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest("/jobs", { token: session.token, method: "POST", body: jobForm });
      setJobForm(emptyJob);
      await loadJobs();
      setSelectedJob(result.job._id);
      toast.success(result.message);
    } catch (error) { handleRequestError(error); }
    finally { setBusy(false); }
  }

  async function viewCandidateResume(resumeId) {
    try {
      await openResumeFile(resumeId, session.token);
    } catch (error) {
      handleRequestError(error);
    }
  }

  return {
    session,
    jobs,
    selectedJob,
    setSelectedJob,
    matches,
    applications,
    jobForm,
    setJobForm,
    loading,
    busy,
    createJob,
    viewCandidateResume,
  };
}
