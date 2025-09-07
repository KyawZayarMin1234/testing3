"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const e = searchParams.get("email") || "";
    const c = searchParams.get("code") || "";
    setEmail(e);
    setCode(c);
  }, [searchParams]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !code) { setError("Missing email/code"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/verify-code", { email, code });
      setSuccess("Email confirmed! Redirecting...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Verification failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-3xl font-bold mb-4">Confirm Email</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <form onSubmit={handleConfirm} className="flex flex-col gap-4 w-full max-w-sm">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required className="input" />
        <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g,""))} maxLength={6} placeholder="6-digit code" required className="input text-center" />
        <button disabled={loading} className="btn">{loading ? "Confirming..." : "Confirm"}</button>
      </form>
    </div>
  );
}
