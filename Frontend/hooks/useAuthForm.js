"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { writeSession } from "../lib/session";

const initialForm = { name: "", email: "", password: "", role: "candidate" };

export function useAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  function complete(session) {
    writeSession(session);
    router.replace(session.user.role === "recruiter" ? "/recruiter" : "/candidate");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      complete(mode === "login" ? await authApi.login(form) : await authApi.register(form));
      toast.success(mode === "login" ? "Welcome back." : "Account created.");
    }
    catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  }

  async function loadDemo() {
    setBusy(true);
    try {
      complete(await authApi.demo(form.role));
      toast.success("Sample workspace loaded.");
    }
    catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  }

  return { mode, setMode, form, setForm, busy, submit, loadDemo };
}
