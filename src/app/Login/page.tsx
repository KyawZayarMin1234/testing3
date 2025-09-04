"use client";
import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileMenu from "../component/profile";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) setError(res.error);
    else router.push("/");
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 px-3 py-2 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="mr-1 w-4 h-4" />
        Back
      </button>
      <ProfileMenu session={null} userScores={null} isDark={false} signOut={function (): void {
        throw new Error("Function not implemented.");
      } }/>
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-sm p-8 bg-transparent">
          <h1 className="text-3xl font-bold text-center">Yoo, welcome back!</h1>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            First time here?{" "}
            <Link
              href="/register"
              className="cursor-pointer hover:underline text-neutral-900 dark:text-neutral-100"
            >
              Sign up for free
            </Link>
          </p>

          {error && (
            <p className="text-red-600 dark:text-red-400 mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Your email"
              className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-4 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />

            <button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-neutral-900 font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Sign In
            </button>

            <div className="flex items-center justify-center gap-4 my-6">
              <hr className="flex-grow border-t border-neutral-300 dark:border-neutral-700" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">OR</span>
              <hr className="flex-grow border-t border-neutral-300 dark:border-neutral-700" />
            </div>
          </form>

          <button
            className="w-full bg-white hover:bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100 font-semibold py-2 px-4 rounded-md transition-colors border border-neutral-300 dark:border-neutral-700 flex items-center justify-center"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            type="button"
          >
            <Image src="/assets/googlelogo.webp" alt="Google" height={20} width={20} />
            <span className="ml-2">Sign in with Google</span>
          </button>

          <p className="text-center text-sm text-stone-400 mt-4">
            By signing up, you agree to our{" "}
            <Link className="cursor-pointer hover:underline text-neutral-900 dark:text-neutral-100" href="/terms&conditions">
              Terms and Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}