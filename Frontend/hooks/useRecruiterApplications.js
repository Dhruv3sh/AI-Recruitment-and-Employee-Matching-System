"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, isUnauthorizedError, openApplicationResumeFile } from "../lib/api";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";

export function useRecruiterApplications() {
  const { session, endSession } = useWorkspaceSession();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const handleError = useCallback((error) => {
    if (isUnauthorizedError(error)) {
      toast.error("Your session has expired. Please sign in again.");
      endSession();
      return;
    }
    toast.error(error.message);
  }, [endSession]);

  const load = useCallback(async () => {
    const result = await apiRequest("/applications/received", { token: session.token });
    setApplications(result.applications || []);
  }, [session.token]);

  useEffect(() => {
    load().catch(handleError).finally(() => setLoading(false));
  }, [handleError, load]);

  async function decide(applicationId, decision) {
    setBusyId(applicationId);
    try {
      const result = await apiRequest(`/applications/${applicationId}/decision`, {
        token: session.token,
        method: "PATCH",
        body: { decision },
      });
      setApplications((current) => current.map((application) => (
        application._id === applicationId
          ? { ...application, status: result.application.status }
          : application
      )));
      toast.success(result.message);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyId("");
    }
  }

  async function viewResume(applicationId) {
    try {
      await openApplicationResumeFile(applicationId, session.token);
    } catch (error) {
      handleError(error);
    }
  }

  return { applications, loading, busyId, decide, viewResume };
}
