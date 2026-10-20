"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { emptyJob } from "../utils/format";

export function useRecruiterWorkspace() {
  const { session, endSession } = useWorkspaceSession();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matches, setMatches] = useState([]);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

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
    const matchResult = await apiRequest(`/matches/jobs/${jobId}`, { token: session.token });
    setMatches(matchResult.matches || []);
  }, [session]);

  const loadJobs = useCallback(async () => {
    const result = await apiRequest("/jobs", { token: session.token });
    const openJobs = (result.jobs || []).filter((job) => job.status === "open");
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

  async function generateDescription() {
    if (!jobForm.title.trim()) {
      toast.error("Enter a job title before generating a description.");
      return;
    }
    setGeneratingDescription(true);
    try {
      const result = await apiRequest("/jobs/generate-description", {
        token: session.token,
        method: "POST",
        body: jobForm,
      });
      setJobForm((current) => ({ ...current, description: result.description }));
      toast.success(result.message);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setGeneratingDescription(false);
    }
  }

  return {
    session,
    jobs,
    selectedJob,
    setSelectedJob,
    matches,
    jobForm,
    setJobForm,
    loading,
    busy,
    generatingDescription,
    createJob,
    generateDescription,
  };
}
