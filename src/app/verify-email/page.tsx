"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// A wrapper component is needed to use useSearchParams because it requires a Suspense boundary
const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email, please wait...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing. Please check the link in your email.");
      return;
    }

    const verifyToken = async () => {
      try {
        // ✅ FIX: Changed the endpoint to the correct '/auth/verify-link'
        await axios.post("http://localhost:8000/auth/verify-link", { token });
        setStatus("success");
        setMessage("Your email has been successfully verified! You can now log in.");
      } catch (error) {
        setStatus("error");
        if (axios.isAxiosError(error) && error.response) {
          setMessage(error.response.data.detail || "Verification failed. The link may be invalid or expired.");
        } else {
          setMessage("An unexpected error occurred. Please try again later.");
        }
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-4">
      <div className="w-full max-w-md p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-xl shadow-lg">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-cyan-500 animate-spin" />
            <h1 className="mt-4 text-2xl font-bold">Verifying...</h1>
          </>
        )}
        {status === "success" && (
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
        )}
        
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">{message}</p>

        {status === "success" && (
          <Link href="/login" className="mt-6 inline-block bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
};

// The main page component that wraps the content in a Suspense boundary
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}

