"use client";
import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileMenu from "../component/profile";
import axios from "axios";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // State for the multi-step verification process
  const [registrationStep, setRegistrationStep] = useState<"form" | "verify">("form");
  const [verificationCode, setVerificationCode] = useState("");

  const [passwordStrength, setPasswordStrength] = useState<{
    label: string;
    color: string;
    score: number;
  } | null>(null);

  // Evaluate password strength
  const evaluatePasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", score: 1 };
    if (score <= 2) return { label: "Medium", color: "bg-yellow-500", score: 2 };
    if (score <= 3) return { label: "Strong", color: "bg-green-500", score: 3 };
    return { label: "Very Strong", color: "bg-blue-600", score: 4 };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(evaluatePasswordStrength(pwd));
  };

  // Step 1: Handle the initial registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordStrength || passwordStrength.score < 3) {
      setError("Password must be at least 'Strong'.");
      return;
    }
    setLoading(true);
    try {
      // Call your backend to register the user and send a code
      await axios.post("http://localhost:8000/auth/register", {
        name,
        email,
        password,
      });
      setSuccessMessage("Registration successful! Please check your email for a verification code.");
      setRegistrationStep("verify"); // Move to the next step
    } catch (err: any) {
      setError(err.response?.data?.detail || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle the verification code submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!verificationCode || verificationCode.length !== 6) {
        setError("Please enter a valid 6-digit code.");
        return;
    }
    setLoading(true);
    try {
      // Call your backend to verify the code
      await axios.post("http://localhost:8000/auth/verify-code", {
        email, // The email from the first step
        code: verificationCode,
      });
      setSuccessMessage("Verification successful! You can now log in.");
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 text-white flex flex-col">
      <div className="flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-sm text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
        >
          <ChevronLeft className="mr-1 w-4 h-4" />
          Back
        </button>
        <ProfileMenu session={null} userScores={null} isDark={true} signOut={() => {}} />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm p-8 bg-transparent">
          
          {/* Renders content based on the current registration step */}
          {registrationStep === "form" ? (
            // --- STEP 1: REGISTRATION FORM ---
            <div>
              <h1 className="text-3xl font-bold text-center text-neutral-100">Warmly welcome!</h1>
              <p className="text-center text-sm text-stone-400 mt-2">
                Already have an account?{" "}
                <Link href="./login" className="cursor-pointer hover:underline text-neutral-100">
                  Log In
                </Link>
              </p>
              {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
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
                <div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
                  />
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="w-full h-2 bg-gray-600 rounded">
                        <div
                          className={`h-2 rounded transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score * 25}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-sm text-gray-400">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
                />
                <button
                  type="submit"
                  disabled={loading || !passwordStrength || passwordStrength.score < 3}
                  className="w-full font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 text-black"
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </form>

              <div className="flex items-center justify-center gap-4 my-6">
                <hr className="flex-grow border-t border-neutral-700" />
                <span className="text-sm text-stone-400">OR</span>
                <hr className="flex-grow border-t border-neutral-700" />
              </div>
              <button
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2 px-4 rounded-md transition-colors border border-neutral-700 flex items-center justify-center"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <Image src="/assets/googlelogo.webp" alt="Google Logo" height={28} width={28} />
                <p className="ml-[8px]">Sign In with Google</p>
              </button>
            </div>
          ) : (
            // --- STEP 2: VERIFICATION FORM ---
            <div>
              <h1 className="text-3xl font-bold text-center text-neutral-100">Check your email</h1>
              <p className="text-center text-sm text-stone-400 mt-2">
                We've sent a 6-digit verification code to <span className="font-bold text-neutral-100">{email}</span>.
              </p>
              {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
              {successMessage && <p className="text-green-500 mt-4 text-center font-semibold">{successMessage}</p>}
              <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
                 <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full text-center tracking-[1em] px-4 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600"
                />
                 <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 text-black"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </form>
               <p className="text-center text-sm text-stone-400 mt-4">
                 Didn't get a code?{" "}
                 <button onClick={() => setRegistrationStep('form')} className="cursor-pointer hover:underline text-neutral-100">
                   Go back and try again
                 </button>
               </p>
            </div>
          )}
          
          <p className="text-center text-sm text-stone-400 mt-4">
            By signing up, you agree to our{" "}
            <Link className="cursor-pointer hover:underline text-neutral-100" href="/terms&conditions">
              Terms and Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

