"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError, openResumeFile } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { emptyProfile } from "../utils/format";

export function useCandidateWorkspace() {
  const { session, save, endSession } = useWorkspaceSession();
  const [profile, setProfile] = useState(emptyProfile);
  const [recommendations, setRecommendations] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [resumePendingRemoval, setResumePendingRemoval] = useState(null);
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

  const refresh = useCallback(async (activeSession) => {
    if (!activeSession?.token) return;
    const [current, matches, uploadedResumes, applications] = await Promise.all([
      apiRequest("/profile/me", { token: activeSession.token }),
      apiRequest("/matches/recommendations", { token: activeSession.token }),
      apiRequest("/resumes", { token: activeSession.token }),
      apiRequest("/applications", { token: activeSession.token }),
    ]);
    setProfile({ ...current.user.profile, skills: current.user.profile.skills.join(", ") });
    setRecommendations(matches.matches || []);
    setResumes(uploadedResumes.resumes || []);
    setAppliedJobIds((applications.applications || []).map((application) => String(application.job)));
  }, []);

  const refreshAfterBackgroundWork = useCallback((activeSession) => {
    [2_000, 10_000, 30_000, 65_000].forEach((delay) => {
      window.setTimeout(() => {
        refresh(activeSession).catch(handleRequestError);
      }, delay);
    });
  }, [handleRequestError, refresh]);

  useEffect(() => {
    refresh(session).catch(handleRequestError).finally(() => setLoading(false));
  }, [session, refresh, handleRequestError]);

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest("/profile/me", { token: session.token, method: "PATCH", body: profile });
      const next = { ...session, user: result.user };
      save(next);
      toast.success("Profile saved. Updated matches will appear shortly.");
      refreshAfterBackgroundWork(next);
    } catch (error) { handleRequestError(error); }
    finally { setBusy(false); }
  }

  async function uploadResume(file) {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const result = await apiRequest("/resumes", { token: session.token, method: "POST", body: formData });
      setResumes((current) => [result.resume, ...current]);
      toast.success(result.message);
      refreshAfterBackgroundWork(session);
    } catch (error) { handleRequestError(error); }
    finally { setBusy(false); }
  }

  async function viewResume(resumeId) {
    try {
      await openResumeFile(resumeId, session.token);
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function deleteResume(resume) {
    setBusy(true);
    try {
      await apiRequest(`/resumes/${resume.id}`, { token: session.token, method: "DELETE" });
      setResumes((current) => current.filter((item) => item.id !== resume.id));
      toast.success("Resume removed.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  function requestResumeRemoval(resume) {
    setResumePendingRemoval(resume);
  }

  function cancelResumeRemoval() {
    setResumePendingRemoval(null);
  }

  async function confirmResumeRemoval() {
    if (!resumePendingRemoval) return;
    const resume = resumePendingRemoval;
    setResumePendingRemoval(null);
    await deleteResume(resume);
  }

  async function applyForJob(jobId) {
    setBusy(true);
    try {
      const result = await apiRequest("/applications", {
        token: session.token,
        method: "POST",
        body: { jobId },
      });
      setAppliedJobIds((current) => [...new Set([...current, String(jobId)])]);
      toast.success(result.message);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  return {
    session,
    profile,
    setProfile,
    recommendations,
    resumes,
    appliedJobIds,
    resumePendingRemoval,
    loading,
    busy,
    saveProfile,
    uploadResume,
    viewResume,
    requestResumeRemoval,
    cancelResumeRemoval,
    confirmResumeRemoval,
    applyForJob,
  };
}
