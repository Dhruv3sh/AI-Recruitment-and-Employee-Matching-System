"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useWorkspaceSession } from "../components/layout/WorkspaceContext";
import { apiRequest, isUnauthorizedError } from "../lib/api";
import { emptyJob } from "../utils/format";

function jobToForm(job) {
  return {
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    experience: job.requirements?.experience ?? 0,
    skills: (job.requirements?.skills || []).join(", "),
    education: job.requirements?.education || "",
    description: job.description || "",
  };
}

export function usePublishedRoles() {
  const { session, endSession } = useWorkspaceSession();
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [rolePendingClose, setRolePendingClose] = useState(null);
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

  const loadRoles = useCallback(async () => {
    const result = await apiRequest("/jobs", { token: session.token });
    setRoles(result.jobs || []);
  }, [session]);

  useEffect(() => {
    loadRoles().catch(handleRequestError).finally(() => setLoading(false));
  }, [handleRequestError, loadRoles]);

  function startEditing(role) {
    setEditingRole(role);
    setJobForm(jobToForm(role));
  }

  function cancelEditing() {
    setEditingRole(null);
    setJobForm(emptyJob);
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

  async function saveRole(event) {
    event.preventDefault();
    if (!editingRole) return;
    setBusy(true);
    try {
      const result = await apiRequest(`/jobs/${editingRole._id}`, {
        token: session.token,
        method: "PATCH",
        body: jobForm,
      });
      setRoles((current) => current.map((role) => (
        role._id === result.job._id ? result.job : role
      )));
      setEditingRole(result.job);
      toast.success(result.message);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function closeRole() {
    if (!rolePendingClose) return;
    const role = rolePendingClose;
    setRolePendingClose(null);
    setBusy(true);
    try {
      const result = await apiRequest(`/jobs/${role._id}/close`, {
        token: session.token,
        method: "PATCH",
      });
      setRoles((current) => current.map((item) => (
        item._id === result.job._id ? result.job : item
      )));
      if (editingRole?._id === result.job._id) setEditingRole(result.job);
      toast.success(result.message);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  return {
    roles,
    editingRole,
    jobForm,
    setJobForm,
    rolePendingClose,
    loading,
    busy,
    generatingDescription,
    startEditing,
    cancelEditing,
    generateDescription,
    saveRole,
    requestClose: setRolePendingClose,
    cancelClose: () => setRolePendingClose(null),
    closeRole,
  };
}
