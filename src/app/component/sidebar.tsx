"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import axios, { AxiosError, CancelTokenSource } from "axios"
import { useSession } from "next-auth/react"
import { Menu, X, SquarePen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SheetClose } from "@/components/ui/sheet"
import { translations } from "../translations"; 
interface ChatSession {
  session_id: number
  title: string | null
  created_at?: string
}
interface SidebarProps {
  onSelectSession: (sessionId: number, messages: { role: string; text: string }[]) => void
  currentSessionId?: number | null
  language: "en" | "my";
  apiBaseUrl?: string
}
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function Sidebar({
  onSelectSession,
  currentSessionId = null,
  language,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
}: SidebarProps) {
  const { data: auth } = useSession()
  const userId = (auth as any)?.user?.id
  const t = translations[language];
  const [expand, setExpand] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const cancelRef = useRef<CancelTokenSource | null>(null)

  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const dm = localStorage.getItem("isDarkMode")
    setIsDark(dm === "true")
  }, [])

  // const fetchSessions = async () => {
  //   if (!userId) return
  //   cancelRef.current?.cancel("new-request")
  //   cancelRef.current = axios.CancelToken.source()
  //   try {
  //     setLoading(true)
  //     setError(null)
  //     const res = await axios.get(`${apiBaseUrl}/chat/sessions/${userId}`, {
  //       cancelToken: cancelRef.current.token,
  //     })
  //     setSessions(Array.isArray(res.data) ? res.data : [])
  //   } catch (err) {
  //     if (axios.isCancel(err)) return
  //     const e = err as AxiosError
  //     console.error("Error fetching sessions:", e)
  //     setError("Could not load sessions")
  //     setSessions([])
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const fetchSessions = async () => {
    if (!userId) return;
    cancelRef.current?.cancel("new-request");
    cancelRef.current = axios.CancelToken.source();
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiBaseUrl}/chat/sessions/${userId}`, {
        cancelToken: cancelRef.current.token,
      });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Error fetching sessions:", err);
      setError("Could not load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSessions()
  }, [userId, apiBaseUrl])

  const filtered = sessions

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

  // const handleCreate = async () => {
  //   if (!userId) return;
  //   try {
  //     setCreating(true);
  //     const res = await axios.post(`${apiBaseUrl}/chat/session`, {
  //       user_id: userId,
  //       title: "New Chat",
  //     });
  //     const sid = res.data?.session_id;
  //     if (sid) {
  //       await fetchSessions();
  //       onSelectSession(sid, []);
  //     }
  //   } catch (err) {
  //     console.error("Error creating new chat session:", err);
  //   } finally {
  //     setCreating(false);
  //   }
  // };

  const handleCreate = async () => {
    if (!userId) return;
    try {
      setCreating(true);
  
      const formData = new FormData();
      formData.append("user_id", userId);  // must be string
      formData.append("title", "New Chat");
  
      const res = await axios.post(`${apiBaseUrl}/chat/session`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // important for FormData
        },
      });
  
      const sid = res.data?.session_id;
      if (sid) {
        await fetchSessions(); // refresh session list
        onSelectSession(sid, []); // select the new session
      }
    } catch (err: any) {
      console.error("Error creating new chat session:", err.response?.data || err.message);
    } finally {
      setCreating(false);
    }
  };
  
  

 
  
  function PrimaryNav() {
    return (
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
            {expand && (
              <span className="whitespace-nowrap transition-opacity duration-200">
                {t.newChat}
              </span>
            )}
          </button>
        </li>
      </ul>
    )
  }

  function ChatsList() {
    return (
      <div className="flex-1 px-2 pb-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">{expand ? "No sessions" : " "}</div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] pr-2">
            <div className="space-y-1">
              {filtered.map((s) => {
                const active = s.session_id === currentSessionId
                const label = s.title || `Chat ${s.session_id}`

                return (
                  <button
                    key={s.session_id}
                    onClick={() => handleSelect(s.session_id)}
                    title={expand ? label : undefined} 
                    className={cn(
                      "group w-full truncate rounded px-3 py-2 text-left text-sm",
                      "transition-colors hover:bg-accent focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      active && "bg-accent"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {expand ? (
                      <span>{label}</span>
                    ) : (
                      <span className="block text-center">{label.slice(0, 1)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    )
  }
  function MobileSidebarBody() {
    return (
      <div className="flex h-full w-full flex-col">
   
        <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t.chats}</h2>

            <div className="flex items-center gap-2">
            
              <Button
                onClick={handleCreate}
                disabled={creating}
                size="sm"
                className="gap-2"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquarePen className="h-4 w-4" />}
                <span className="text-sm">New chat</span>
              </Button>

             
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close sidebar"
                >
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
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No sessions yet. Start one with <span className="font-medium">New chat</span>.
            </div>
          ) : (
            <ul className="p-2">
              {filtered.map((s) => {
                const active = s.session_id === currentSessionId
                const label = s.title || `Chat ${s.session_id}`

                return (
                  <li key={s.session_id} className="py-1">
                    <button
                      onClick={() => handleSelect(s.session_id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3 py-3",
                        "text-left",
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


  function SidebarBody() {
    return (
      <div className="flex h-full w-full flex-col">
   
        <div className="flex items-center justify-end gap-2 p-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpand((e) => !e)}
            aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expand}
            className="transition-transform"
          >
            {expand ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <PrimaryNav />

        <Separator className="my-3" />

        <div
          className={cn(
            "px-4 pb-1 text-xs font-medium text-muted-foreground",
            "transition-all duration-200",
            expand ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
          )}
        >
          {t.chats}
        </div>

        <ChatsList />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
     
      <aside
        data-expanded={expand}
        className={cn(
          "hidden md:flex shrink-0 min-h-screen border-r bg-background/95 backdrop-blur",
          "transition-[width] duration-300 ease-out will-change-[width]",
          expand ? "w-64" : "w-14",
          isDark ? "text-zinc-300" : "text-zinc-700 bg-white",
          "dark:bg-transparent"
        )}
      >
        {/* Desktop toggle */}
        <div className="absolute left-2 top-3 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpand(e => !e)}
            aria-label={expand ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expand}
            className="transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className={cn("transition-transform duration-300", expand ? "rotate-0" : "rotate-180")}>
              {expand ? (
                <X className={cn(!isDark && "text-zinc-600")} />
              ) : (
                <Menu className={cn(!isDark && "text-zinc-600")} />
              )}
            </div>
          </Button>
        </div>

        {/* Desktop content */}
        <div className="flex w-full pt-10">
          <SidebarBody />
        </div>
      </aside>

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
  );

}