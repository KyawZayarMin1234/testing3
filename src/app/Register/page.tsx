"use client";
import React from "react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import ProfileMenu from "../component/profile";
export default function Register() {

  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");


  const [loading, setLoading] = React.useState(false);

      const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const res = await signIn("credentials", {
          email,
          password,
          name,
          isSignUp: "true",
          redirect: false,
        });

        if (res?.error) {
          setError(res.error);
        }else{
            router.push('/');
        }
      };


  return (
    <div className="min-h-screen px-4 py-6 text-white">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
      >
        <ChevronLeft className="mr-1 w-4 h-4" />
        Back
      </button>
      <ProfileMenu session={null} userScores={null} isDark={true} signOut={function (): void {
        throw new Error("Function not implemented.");
      } }/>
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-full max-w-sm  p-8">
          <h1 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100">Warmly welcome!</h1>
          <p className="text-center text-sm text-stone-400 mt-2">
            Already have an account?{" "}
            <Link href='./login' className="cursor-pointer hover:underline text-neutral-900 dark:text-neutral-100">
              Log In
            </Link>
          </p>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleRegister} className="mt-8 space-y-6">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              placeholder="Your name"
              className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-2 px-4 rounded-md transition-colors "
            >
              Register
            </button>
            <div className="flex items-center justify-center gap-4 my-6">
              <hr className="flex-grow border-t border-neutral-700" />
              <span className="text-sm text-stone-400">OR</span>
              <hr className="flex-grow border-t border-neutral-700" />
            </div>
          </form>
          <button
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2 px-4 rounded-md transition-colors border border-neutral-700 flex items-center justify-center"
              onClick={() => signIn("google",{ callbackUrl: "/" })}
            >
              <Image src="/assets/googlelogo.webp" alt="orb" height={28} width={28} />
              <p className="ml-[8px]">Sign In with Google</p>
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