"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Pencil, X } from "lucide-react";
import { JobForm } from "../../../components/jobs/JobForm";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { RouteLoading } from "../../../components/ui/RouteLoading";
import { usePublishedRoles } from "../../../hooks/usePublishedRoles";
import { labelSkill } from "../../../utils/format";

export default function PublishedRolesPage() {
  const workspace = usePublishedRoles();
  const [statusFilter, setStatusFilter] = useState("all");
  const visibleRoles = useMemo(() => workspace.roles.filter((role) => (
    statusFilter === "all" || role.status === statusFilter
  )), [statusFilter, workspace.roles]);

  if (workspace.loading) return <RouteLoading label="Loading published roles..." />;

  return (
    <>
      <section>
        <p className="-mt-8 mb-7 text-sm text-[#617da4]">
          Review every published role, refine its requirements, and close it when applications are no longer needed.
        </p>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-1">Role management</p>
            <h2 className="text-lg font-bold">Published roles</h2>
          </div>
          <select
            className="w-full sm:w-64"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter published roles by status"
          >
            <option value="all">All published roles</option>
            <option value="open">Open roles</option>
            <option value="closed">Closed roles</option>
          </select>
        </div>

        <div className="grid gap-3">
          {visibleRoles.length ? visibleRoles.map((role) => (
            <PublishedRoleCard
              key={role._id}
              role={role}
              busy={workspace.busy}
              onEdit={() => workspace.startEditing(role)}
              onClose={() => workspace.requestClose(role)}
            />
          )) : (
            <EmptyState message="No published roles match this filter." />
          )}
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(workspace.rolePendingClose)}
        title="Close this role?"
        description={`${workspace.rolePendingClose?.title || "This role"} will no longer be visible to candidates or accept new applications.`}
        confirmLabel="Close role"
        onCancel={workspace.cancelClose}
        onConfirm={workspace.closeRole}
      />
      <Modal
        open={Boolean(workspace.editingRole)}
        onClose={workspace.cancelEditing}
        className="max-w-4xl p-6 sm:p-7"
        labelledBy="role-editor-title"
      >
        {workspace.editingRole ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-1">Edit published role</p>
                <h2 id="role-editor-title" className="text-xl font-bold text-ink">
                  {workspace.editingRole.title}
                </h2>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-[9px] border border-[#cad9eb] text-[#58769c] transition hover:bg-blue-50"
                aria-label="Close role editor"
                title="Close editor"
                onClick={workspace.cancelEditing}
              >
                <X size={18} />
              </button>
            </div>
            <JobForm
              job={workspace.jobForm}
              onChange={workspace.setJobForm}
              onSubmit={workspace.saveRole}
              busy={workspace.busy}
              submitLabel="Save role changes"
              onGenerateDescription={workspace.generateDescription}
              generatingDescription={workspace.generatingDescription}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function PublishedRoleCard({ role, busy, onEdit, onClose }) {
  const isOpen = role.status === "open";
  return (
    <article className="rounded-[9px] border border-[#d6e2ef] bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase ${isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {role.status}
            </span>
            <span className="text-xs text-slate-500">
              Updated {new Date(role.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-ink">{role.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><BriefcaseBusiness size={14} /> {role.company}</span>
            {role.location ? <span className="flex items-center gap-1"><MapPin size={14} /> {role.location}</span> : null}
            <span>{role.requirements?.experience || 0}+ years</span>
          </p>
          {role.description ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-xs leading-relaxed text-slate-600">
              {role.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(role.requirements?.skills || []).map((skill) => (
              <span key={skill} className="skill-chip">{labelSkill(skill)}</span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="secondary-button" onClick={onEdit}>
            <Pencil size={15} /> Edit
          </button>
          {isOpen ? (
            <button type="button" className="danger-button" disabled={busy} onClick={onClose}>
              Close role
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
