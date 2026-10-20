"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError, openResumeFile } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { emptyProfile } from "../utils/format";
import { getApplicationReadiness } from "../utils/applicationReadiness";

export function useCandidateWorkspace() {
  const { session, save, endSession } = useWorkspaceSession();
  const [profile, setProfile] = useState(emptyProfile);
  const [recommendations, setRecommendations] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
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
      setResumes([result.resume]);
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

  async function applyForJob(jobId) {
    const readiness = getApplicationReadiness(profile, resumes);
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
    applicationReady: getApplicationReadiness(profile, resumes).ready,
    applicationReadinessMessage: getApplicationReadiness(profile, resumes).message,
    appliedJobIds,
    loading,
    busy,
    saveProfile,
    uploadResume,
    viewResume,
    applyForJob,
  };
}
