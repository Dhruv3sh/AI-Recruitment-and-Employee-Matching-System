"use client";

import { BrandMark } from "../../components/ui/BrandMark";
import { Field } from "../../components/ui/Field";
import { useAuthForm } from "../../hooks/useAuthForm";

export default function AuthScreen() {
  const { mode, setMode, form, setForm, busy, submit, loadDemo } =
    useAuthForm();
  const update = (field, value) => setForm({ ...form, [field]: value });
  return (
    <main className="grid min-h-screen bg-[#f5f9ff] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
      <section className="hidden flex-col justify-center bg-[#102b5a] px-[clamp(40px,8vw,120px)] text-white lg:flex">
        <BrandMark href="/auth" dark />
        <div className="mt-20">
          <p className="eyebrow text-blue-200">
            AI recruitment and employee matching
          </p>
          <h1 className="mt-3 max-w-2xl text-5xl font-extrabold leading-tight xl:text-6xl">
            Better matching starts with evidence.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
            Structured profiles, parsed job requirements, and clear scoring keep
            decisions in human hands.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs text-blue-100">
            <span className="border border-slate-600 bg-slate-800 px-2 py-1.5">
              Candidate profile
            </span>
            <b className="text-teal-300">+</b>
            <span className="border border-slate-600 bg-slate-800 px-2 py-1.5">
              Job requirements
            </span>
            <b className="text-teal-300">=</b>
            <strong className="border border-teal-700 bg-slate-800 px-2 py-1.5 font-medium text-teal-300">
              Explainable match
            </strong>
          </div>
        </div>
      </section>
      <section className="m-auto w-full max-w-xl p-5 sm:p-10">
        <div className="mb-8 lg:hidden"><BrandMark href="/auth" /></div>
        <div className="panel bg-white p-7 sm:p-9">
          <div className="mb-7">
            <p className="eyebrow">
              {mode === "register" ? "Create workspace" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">
              {mode === "register"
                ? "Start your Phase 1 workspace"
                : "Sign in to Matchwise"}
            </h2>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            {mode === "register" && (
              <Field label="Full name">
                <input
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                minLength="8"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                required
              />
            </Field>
            {mode === "register" && (
              <Field label="Role">
                <select
                  value={form.role}
                  onChange={(event) => update("role", event.target.value)}
                >
                  <option value="candidate">Candidate</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </Field>
            )}
            <button className="primary-button mt-1 w-full" disabled={busy}>
              {busy
                ? "Working..."
                : mode === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
          <button
            type="button"
            className="mt-3 w-full rounded-[9px] border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-65"
            onClick={loadDemo}
            disabled={busy}
          >
            Explore with sample data
          </button>
          <p className="mt-5 text-center text-xs text-slate-500">
            {mode === "register"
              ? "Already have an account?"
              : "New to Matchwise?"}{" "}
            <button
              type="button"
              className="font-bold text-brand"
              onClick={() =>
                setMode(mode === "register" ? "login" : "register")
              }
            >
              {mode === "register" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
