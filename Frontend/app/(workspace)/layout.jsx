"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { WorkspaceProvider } from "../../components/layout/WorkspaceContext";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useSession } from "../../hooks/useSession";

const workspaceCopy = {
  "/candidate": {
    eyebrow: "Candidate workspace",
    title: "Find work that fits",
  },
  "/recruiter": {
    eyebrow: "Recruiter workspace",
    title: "Build a sharper shortlist",
  },
  "/jobs": {
    eyebrow: "Candidate workspace",
    title: "Explore open roles",
  },
  "/applications": {
    eyebrow: "Recruiter workspace",
    title: "Applications received",
  },
  "/roles": {
    eyebrow: "Recruiter workspace",
    title: "Manage published roles",
  },
  "/recommendations": {
    eyebrow: "System map",
    title: "Understand every signal",
  },
};

export default function WorkspaceLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, save, signOut } = useSession();
  const copy = pathname.startsWith("/jobs/")
    ? { eyebrow: "Candidate workspace", title: "Job details" }
    : workspaceCopy[pathname] || workspaceCopy["/candidate"];

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      router.replace("/auth");
      return;
    }

    if (pathname === "/candidate" && session.user.role === "recruiter") {
      router.replace("/recruiter");
    }

    if (pathname === "/recruiter" && session.user.role !== "recruiter") {
      router.replace("/candidate");
    }

    if (pathname.startsWith("/jobs") && session.user.role !== "candidate") {
      router.replace("/recruiter");
    }

    if (pathname === "/applications" && session.user.role !== "recruiter") {
      router.replace("/candidate");
    }

    if (pathname === "/roles" && session.user.role !== "recruiter") {
      router.replace("/candidate");
    }
  }, [pathname, ready, router, session]);

  const hasWrongRole =
    (pathname === "/candidate" && session?.user.role === "recruiter") ||
    (pathname === "/recruiter" && session?.user.role !== "recruiter") ||
    (pathname.startsWith("/jobs") && session?.user.role !== "candidate") ||
    (pathname === "/applications" && session?.user.role !== "recruiter") ||
    (pathname === "/roles" && session?.user.role !== "recruiter");

  const handleSignOut = useCallback(() => {
    signOut();
    router.replace("/auth");
  }, [router, signOut]);

  if (!ready || !session || hasWrongRole) {
    return <LoadingScreen />;
  }

  return (
    <WorkspaceProvider value={{ session, save, endSession: handleSignOut }}>
      <AppShell
        session={session}
        eyebrow={copy.eyebrow}
        title={copy.title}
        onSignOut={handleSignOut}
      >
        {children}
      </AppShell>
    </WorkspaceProvider>
  );
}
