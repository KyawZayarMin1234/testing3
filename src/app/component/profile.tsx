"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, LogIn, Bolt, Moon, SunDim, Star ,Languages} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {translations} from "../translations"

type Props = {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  userScores: number | null; 
  isDark: boolean;
  signOut: () => void;
  language: "en" | "my";
  setLanguage: (lang: "en" | "my") => void;
  clearChat:()=>void
};

export default function ProfileMenu({
  session,
  userScores,
  signOut, language, setLanguage,clearChat
}: Props) {
  const name = session?.user?.name || "Guest";
  const email = session?.user?.email || "";
  const img = session?.user?.image || "/assets/orb2.png";
  const initials =
    name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  const { theme, systemTheme, setTheme } = useTheme();
  const [translate, setTranslate] = useState("Myanamar");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = theme === "system" ? systemTheme : theme;
  const dark = current === "dark";
  const t=translations[language];
  const score = Math.max(0, Math.floor(userScores ?? 0));        
  const stars = Math.min(5, Math.floor(score / 25));            
  const percent = Math.min(100, Math.max(0, (score / 125) * 100)); 

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "my" : "en");
  };
  
  return (
    <div className="absolute top-4 right-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto w-auto rounded-[20px]"
            aria-label="Open profile menu"
          >
            <Avatar className="h-10 w-10 rounded-[20px]">
              <AvatarImage src={img} alt="User Profile" />
              <AvatarFallback className="rounded-[20px]">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-60 p-0 rounded-2xl border border-border/60 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md overflow-hidden"
        >
          
          <DropdownMenuLabel className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-xl">
                <AvatarImage src={img} alt="User Profile" />
                <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border/60" />

  
          <DropdownMenuItem className="gap-2 px-4 py-3" aria-label="Score summary">
            <Bolt className="h-4 w-4 opacity-80" />
            <span className="truncate">
              {userScores !== null ? `${score} ${t.marks}` : "No Scores"}
            </span>
          </DropdownMenuItem>

          
          <div className="px-4 py-3" role="group" aria-label="Quiz progress">
            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-2" aria-label={`${stars} of 5 stars`}>
              {[0, 1, 2,3,4].map((i) => {
                const filled = i < stars;
                return (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${filled ? "text-yellow-400" : "text-muted-foreground/50"}`}
                    style={filled ? { fill: "currentColor" } : {}}
                    aria-hidden="true"
                  />
                );
              })}
              <span className="ml-2 text-xs text-muted-foreground">{stars}/5</span>
            </div>

            <div className="w-full">
              <div
                className="relative h-2.5 w-full rounded-full bg-muted/60 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={75}
                aria-valuenow={score}
                aria-label="Marks progress"
                title={`${score} / 125`}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>{score} / 125</span>
                <span>{Math.round(percent)}%</span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/60" />
          <DropdownMenuItem asChild className="px-4 py-2 gap-2">
            {mounted && (
              <button
                type="button"
                onClick={toggleLanguage}
                className="w-full inline-flex items-center gap-2 rounded-md text-sm hover:bg-accent transition-colors"
                aria-pressed={language === "my"}
              >
                <Languages className="h-4 w-4" />
                <span className="truncate">{language === "en" ? "မြန်မာ" :  "English"}</span>
              </button>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuItem className="px-4 py-2">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(dark ? "light" : "dark")}
                className="w-full inline-flex items-center gap-2 rounded-md text-sm hover:bg-accent transition-colors"
                aria-pressed={dark}
              >
                {dark ? <SunDim className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="truncate">{dark ? `Light` : `Dark`}</span>
              </button>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/60" />

          {/* Auth action */}
          {session ? (
            <DropdownMenuItem
              onClick={signOut}
              className="px-4 py-2 gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>LogOut</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild className="px-4 py-2 gap-2" onClick={clearChat}>
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-destructive" />
                <span className="hover:text-destructive">Log In</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
