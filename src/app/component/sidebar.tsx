"use client"

import React, { useEffect, useRef, useState } from "react"
import axios, { AxiosError, CancelTokenSource } from "axios"
import { useSession } from "next-auth/react"
import { Menu, X, SquarePen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { translations } from "../translations"
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSession {
  session_id: number
  title: string | null
  created_at?: string
}

interface SidebarProps {
  onSelectSession: (sessionId: number, messages: { role: string; text: string }[]) => void
  currentSessionId?: number | null
  language: "en" | "my"
  apiBaseUrl?: string
  /** 🔑 NEW: last user message (from Home.tsx) */
  lastUserMessage?: string | null
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function Sidebar({
  onSelectSession,
  currentSessionId = null,
  language,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
  lastUserMessage = null,
}: SidebarProps) {
  const { data: auth } = useSession()
  const userId = (auth as any)?.user?.id
  const t = translations[language]

  const [expand, setExpand] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const cancelRef = useRef<CancelTokenSource | null>(null)
  // Add this function inside your Sidebar component in sidebar.tsx
const handleDownload = async (format: 'pdf' | 'docx' | 'csv') => {
  if (!currentSessionId) {
    alert("Please select a chat session to download.");
    return;
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/chat/download/${currentSessionId}?format=${format}`, {
      responseType: 'blob', // Important: tells axios to expect binary data
    });

    // Create a URL for the blob data
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat_session_${currentSessionId}.${format}`);
    
    // Append to the document, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading file:", error);
    alert("Failed to download chat history.");
  }
};

  /** ---------- Fetch sessions ---------- */
  const fetchSessions = async () => {
    if (!userId) return
    cancelRef.current?.cancel("new-request")
    cancelRef.current = axios.CancelToken.source()
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${apiBaseUrl}/chat/sessions/${userId}`, {
        cancelToken: cancelRef.current.token,
      })
      setSessions(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      if (axios.isCancel(err)) return
      const e = err as AxiosError
      console.error("Error fetching sessions:", e)
      setError("Could not load sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [userId, apiBaseUrl])

  /** ---------- Auto-update session title when first user message arrives ---------- */
  useEffect(() => {
    if (!lastUserMessage || !currentSessionId) return
    const session = sessions.find((s) => s.session_id === currentSessionId)
    if (session && (session.title === "New Chat" || !session.title)) {
      const newTitle = lastUserMessage.slice(0, 40) // shorten
      // update backend
      axios
        .patch(`${apiBaseUrl}/chat/session/${currentSessionId}`, { title: newTitle })
        .catch((err) => console.error("Error updating title:", err))
      // update local immediately
      setSessions((prev) =>
        prev.map((s) => (s.session_id === currentSessionId ? { ...s, title: newTitle } : s))
      )
    }
  }, [lastUserMessage, currentSessionId, sessions, apiBaseUrl])

  /** ---------- Select session ---------- */
  const handleSelect = async (sessionId: number) => {
    try {
      const res = await axios.get(`${apiBaseUrl}/chat/messages/${sessionId}`)
      const messages = (res.data || []).map((m: any) => ({ role: m.role, text: m.content }))
      onSelectSession(sessionId, messages)
    } catch (err) {
      console.error("Error fetching messages:", err)
      onSelectSession(sessionId, [])
    }
  }

  /** ---------- Create new session ---------- */
  const handleCreate = async () => {
    if (!userId) return
    try {
      setCreating(true)
      const formData = new FormData()
      formData.append("user_id", userId)
      formData.append("title", "New Chat")

      const res = await axios.post(`${apiBaseUrl}/chat/session`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const sid = res.data?.session_id
      if (sid) {
        await fetchSessions()
        onSelectSession(sid, [])
      }
    } catch (err: any) {
      console.error("Error creating new chat session:", err.response?.data || err.message)
    } finally {
      setCreating(false)
    }
  }

  /** ---------- Desktop Sidebar ---------- */
function SidebarBody() {
  return (
    // The pb-4 adds some padding at the very bottom
    <div className="flex h-full w-full flex-col pb-4">
      {/* --- TOP SECTION --- */}
      {/* New chat button */}
      <ul className="mt-2 w-full space-y-1 px-2">
        <li>
          <button
            onClick={handleCreate}
            disabled={creating}
            className={cn(
              "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
              "transition-colors hover:bg-accent focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            title="New chat"
          >
            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <SquarePen className="h-5 w-5" />}
            {expand && <span>{t.newChat}</span>}
          </button>
        </li>
      </ul>
      <Separator className="my-3" />
      <div className="px-4 pb-1 text-xs font-medium text-muted-foreground">{t.chats}</div>

      {/* --- MIDDLE SECTION (EXPANDS) --- */}
      {/* The flex-1 class makes this section grow and push the download button down */}
      <div className="flex-1 px-2 pb-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No sessions</div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-1">
              {sessions.map((s) => {
                const active = s.session_id === currentSessionId;
                const label = s.title || `Chat ${s.session_id}`;
                return (
                  <Tooltip key={s.session_id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSelect(s.session_id)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded px-3 py-2 text-sm",
                          "transition-colors hover:bg-accent focus-visible:outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          active && "bg-accent"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="truncate">
                          {expand ? label : label.charAt(0).toUpperCase()}
                        </span>
                      </button>
                    </TooltipTrigger>
                    {!expand && <TooltipContent side="right">{label}</TooltipContent>}
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* --- BOTTOM SECTION (PINNED TO BOTTOM) --- */}
      {/* This section is now at the end, so it will appear at the bottom */}
      {currentSessionId && expand && (
        <>
          <Separator className="my-3" />
          <div className="px-2 py-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{t.download}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleDownload("pdf")}>
                  PDF Document (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload("docx")}>
                  Word Document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload("csv")}>
                  CSV Spreadsheet (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}

  /** ---------- Mobile Sidebar ---------- */
  function MobileSidebarBody() {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t.chats}</h2>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreate} disabled={creating} size="sm" className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquarePen className="h-4 w-4" />}
                <span className="text-sm">{t.newChat}</span>
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No sessions yet. Start one with <span className="font-medium">New chat</span>.
            </div>
          ) : (
            <ul className="p-2">
              {sessions.map((s) => {
                const active = s.session_id === currentSessionId
                const label = s.title || `Chat ${s.session_id}`
                return (
                  <li key={s.session_id} className="py-1">
                    <button
                      onClick={() => handleSelect(s.session_id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3 py-3",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active ? "bg-accent" : "hover:bg-accent/60"
                      )}
                      title={label}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{label}</div>
                        {s.created_at && (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 min-h-screen border-r bg-background/95 backdrop-blur transition-[width] duration-300 ease-out",
          expand ? "w-64" : "w-14"
        )}
      >
        {/* toggle */}
        <div className="absolute left-2 top-3 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpand((e) => !e)}
            aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expand}
          >
            {expand ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* content */}
        <div className="flex w-full pt-10">
          <SidebarBody />
        </div>
      </aside>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-2 top-3 z-50 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="flex h-dvh w-[88vw] max-w-[22rem] flex-col p-0 md:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.chats}</SheetTitle>
          </SheetHeader>
          <MobileSidebarBody />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
