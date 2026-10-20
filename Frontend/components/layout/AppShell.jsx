"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  BriefcaseBusiness,
  ChevronDown,
  CircleDotDashed,
  Inbox,
  ListChecks,
  LogOut,
  Map,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { BrandMark } from "../ui/BrandMark";
import { initials } from "../../utils/format";

const navigation = {
  candidate: [
    { href: "/candidate", Icon: UserRound, label: "Candidate desk" },
    { href: "/jobs", Icon: Briefcase, label: "Jobs" },
    { href: "/system", Icon: Map, label: "System map" },
  ],
  recruiter: [
    { href: "/recruiter", Icon: BriefcaseBusiness, label: "Recruiter desk" },
    { href: "/roles", Icon: ListChecks, label: "Published roles" },
    { href: "/applications", Icon: Inbox, label: "Candidates Applications " },
    { href: "/system", Icon: Map, label: "System map" },
  ],
};

export function AppShell({ session, eyebrow, title, onSignOut, children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navigation[session.user.role] || navigation.candidate;
  const home = session.user.role === "recruiter" ? "/recruiter" : "/candidate";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex h-[74px] items-center border-b border-[#d8e4f0] bg-white px-5 lg:px-7">
        <button
          type="button"
          aria-label="Open navigation"
          className="mr-3 grid h-10 w-10 place-items-center rounded-[9px] border border-[#cad9eb] text-[#345478] transition hover:bg-blue-50 lg:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={21} />
        </button>
        <BrandMark href={home} />

        <div className="ml-auto hidden w-full max-w-[300px] items-center lg:flex">
          <label className="flex h-11 w-full items-center gap-3 rounded-[9px] border border-[#cad9eb] bg-[#f8fbff] px-4 text-sm text-[#5e7a9e]">
            <Search size={18} />
            <input
              className="border-0 bg-transparent p-0 text-xs shadow-none ring-0 focus:border-0 focus:ring-0"
              placeholder="Search workspace..."
              aria-label="Search workspace"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-3 lg:ml-5">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-[#c9e2ef] bg-[#edfaff] text-xs font-extrabold text-[#1687d4]">
            {initials(session.user.name).slice(0, 1)}
          </span>
          <div className="hidden min-w-0 sm:block">
            <strong className="block max-w-[10rem] truncate text-xs text-ink">
              {session.user.name}
            </strong>
            <small className="block text-[10px] capitalize text-[#6480a3]">
              {session.user.role}
            </small>
          </div>
          <ChevronDown size={16} className="hidden text-[#42658f] sm:block" />
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[#10264d]/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="lg:grid lg:grid-cols-[273px_minmax(0,1fr)]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-[#d8e4f0] bg-white px-5 py-5 shadow-2xl transition-transform duration-200 lg:sticky lg:top-[74px] lg:z-20 lg:h-[calc(100vh-74px)] lg:w-auto lg:translate-x-0 lg:shadow-none ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between lg:hidden">
            <BrandMark href={home} />
            <button
              type="button"
              aria-label="Close navigation"
              className="grid h-9 w-9 place-items-center rounded-md text-[#58769c] hover:bg-blue-50"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-6 px-2 font-mono text-[10px] font-medium uppercase text-[#58769c] lg:mt-0">
            Workspace
          </p>
          <nav className="mt-4 grid gap-2" aria-label="Workspace navigation">
            {items.map(({ href, Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm transition ${active ? "bg-[#0b2d63] font-bold text-white shadow-[0_8px_16px_rgba(11,45,99,0.16)]" : "font-semibold text-[#627fa4] hover:bg-[#eef5ff] hover:text-[#15396e]"}`}
                >
                  {active ? (
                    <i className="absolute -left-5 h-8 w-1 rounded-r bg-brand" />
                  ) : null}
                  <Icon
                    size={19}
                    className={
                      active
                        ? "text-white"
                        : "text-[#5d7ca4] group-hover:text-brand"
                    }
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-[#d8e4f0] pt-6">
            <p className="px-2 font-mono text-[10px] uppercase text-[#58769c]">
              System status
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-[9px] border border-emerald-100 bg-[#e9fbf3] px-3 py-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CircleDotDashed size={19} />
                <i className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <div>
                <strong className="block text-xs text-[#173a4f]">
                  Matching engine
                </strong>
                <small className="text-[10px] text-[#63819a]">
                  MiniLm and AI services
                </small>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-[#d8e4f0] pt-4">
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-11 w-full items-center gap-3 rounded-[9px] border border-[#cad9eb] px-3 text-xs font-bold text-[#54739a] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#10264d] text-white">
                {initials(session.user.name).slice(0, 1)}
              </span>
              <LogOut size={17} /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 px-5 pb-10 sm:px-8 lg:px-9 xl:px-10">
          <div className="flex min-h-[138px] items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">{eyebrow}</p>
              <h1 className="text-3xl font-extrabold tracking-normal text-[#0d2856] sm:text-[38px]">
                {title}
              </h1>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-[#ebfff5] px-3 py-2 font-mono text-[10px] font-medium uppercase text-emerald-700 sm:inline-flex">
              <CircleDotDashed size={14} /> Preview
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
