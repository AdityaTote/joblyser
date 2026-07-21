'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, Trash2, Settings, PanelLeftClose, PanelLeftOpen, User, LogOut, X, Loader2 } from 'lucide-react';
import { useSessions } from '@/hooks/queries/useAgent';
import { useStore } from '@/store/useStore';
import { SessionsResponse } from '@/types';

function getTimeGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Older';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const user = useStore((s) => s.user);
  const clearStore = useStore((s) => s.clearStore);

  const { data: sessions, isLoading } = useSessions();

  // Extract current session ID from URL
  const currentSessionId = useMemo(() => {
    const match = pathname.match(/\/sessions\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Group sessions by time
  const groupedSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return {};

    const groups: Record<string, SessionsResponse[]> = {};
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

    for (const session of sessions) {
      const group = getTimeGroup(session.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(session);
    }

    // Sort within each group by created_at descending
    for (const group of Object.keys(groups)) {
      groups[group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Return in order
    const ordered: Record<string, SessionsResponse[]> = {};
    for (const key of groupOrder) {
      if (groups[key]) ordered[key] = groups[key];
    }
    return ordered;
  }, [sessions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearStore();
    router.push('/signin');
  };

  const userInitials = useMemo(() => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return '??';
  }, [user]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <nav
        className={`shrink-0 bg-[#060606] border-r border-zinc-800 flex flex-col h-full transition-all duration-300 z-50 fixed lg:static inset-y-0 left-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed && !mobileOpen ? 'w-20' : 'w-64'}`}
      >
        {/* TOP SECTION */}
        <div className="p-4 sm:p-6 flex flex-col gap-6">
          <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'flex-col gap-6' : 'justify-between'}`}>
            <Link href="/new" className="font-heading text-xl font-bold text-amber-400 tracking-tight shrink-0" onClick={() => setMobileOpen?.(false)}>
              {isCollapsed && !mobileOpen ? 'J.' : 'Joblyser.'}
            </Link>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen?.(false)}
              className="lg:hidden text-zinc-600 hover:text-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsProfileOpen(false);
              }}
              className="hidden lg:flex text-zinc-600 hover:text-amber-400 transition-colors shrink-0"
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          <Link
            href="/new"
            title="New Analysis"
            onClick={() => setMobileOpen?.(false)}
            className={`border border-zinc-800 bg-transparent hover:bg-zinc-900 text-white font-semibold transition-all flex items-center justify-center shrink-0 ${
              isCollapsed && !mobileOpen ? 'w-full h-10 px-0' : 'w-full py-3 px-4 gap-2 text-sm rounded-none'
            }`}
          >
            <Plus className={`text-amber-400 shrink-0 ${isCollapsed && !mobileOpen ? 'w-5 h-5' : 'w-4 h-4'}`} strokeWidth={3} />
            {(!isCollapsed || mobileOpen) && <span className="truncate">New Analysis</span>}
          </Link>
        </div>

        {/* MIDDLE SECTION */}
        <div className={`flex-1 overflow-y-auto mt-2 container-snaps ${isCollapsed && !mobileOpen ? 'px-2' : 'px-4'}`}>
          {(!isCollapsed || mobileOpen) && (
            <div className="px-2 pb-4 text-zinc-600 text-xs font-mono uppercase tracking-widest block shrink-0">
              Session History
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          ) : !sessions || sessions.length === 0 ? (
            (!isCollapsed || mobileOpen) && (
              <div className="px-2 py-4 text-zinc-600 text-xs text-center">
                No sessions yet. Start a new analysis!
              </div>
            )
          ) : (
            Object.entries(groupedSessions).map(([group, groupSessions]) => (
              <div key={group} className={`mb-6 ${isCollapsed && !mobileOpen ? 'flex flex-col items-center' : ''}`}>
                {(!isCollapsed || mobileOpen) && (
                  <div className="text-zinc-600 text-xs px-2 py-1.5 font-medium mb-1 shrink-0">
                    {group}
                  </div>
                )}
                <div className={`flex flex-col ${isCollapsed && !mobileOpen ? 'gap-2' : 'gap-0.5'}`}>
                  {groupSessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    const sessionTitle = session.jd_text
                      ? session.jd_text.slice(0, 50)
                      : `Session ${session.id.slice(0, 8)}`;
                    const resumeLabel = session.doc_key
                      ? session.doc_key.split('/').pop()?.replace(/\.[^.]+$/, '') || session.doc_key
                      : null;
                    return (
                      <Link
                        href={`/sessions/${session.id}`}
                        key={session.id}
                        title={session.jd_text || `Session ${session.id.slice(0, 8)}`}
                        onClick={() => setMobileOpen?.(false)}
                        className={`group relative flex cursor-pointer transition-all ${
                          isCollapsed && !mobileOpen
                            ? `w-10 h-10 items-center justify-center border shrink-0 ${
                                isActive
                                  ? 'border-amber-400 bg-zinc-900/40 text-amber-400'
                                  : 'border-zinc-800/50 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                              }`
                            : `px-3 py-2 flex-col border-l-2 shrink-0 ${
                                isActive
                                  ? 'border-amber-400 bg-zinc-900/40 text-white'
                                  : 'border-transparent text-zinc-400 hover:bg-zinc-900/20 hover:text-zinc-200'
                              }`
                        }`}
                      >
                        {isCollapsed && !mobileOpen ? (
                          <span className="font-mono text-sm uppercase font-bold shrink-0">
                            {sessionTitle.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <>
                            <div className="flex items-center justify-between pr-4 w-full min-w-0">
                              <span className={`text-sm font-medium truncate w-full ${isActive ? 'text-amber-400' : ''}`}>
                                {sessionTitle}
                              </span>
                              <button className="absolute right-3 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0" onClick={(e) => e.preventDefault()}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-zinc-600 text-xs truncate mt-0.5 font-sans w-full">
                              {resumeLabel ? `${resumeLabel} • ` : ''}{formatRelativeTime(session.created_at)}
                            </span>
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-4 bg-[#060606] relative border-t border-zinc-800 shrink-0" ref={popupRef}>
          {isProfileOpen && (
            <div
              className={`absolute bottom-full mb-4 bg-[#0a0a0a] border border-zinc-800 shadow-2xl py-1 z-50 transition-all ${
                isCollapsed && !mobileOpen ? 'left-4 w-48' : 'left-4 right-4'
              }`}
            >
              {isCollapsed && !mobileOpen && (
                <div className="px-3 py-2.5 border-b border-zinc-800 mb-1">
                  <p className="text-sm font-medium text-white truncate">{user?.name || user?.email || 'User'}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email || ''}</p>
                </div>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileOpen?.(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors w-full"
              >
                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}

          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center cursor-pointer hover:bg-zinc-900/50 p-2 -mx-2 transition-colors ${
              isCollapsed && !mobileOpen ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-amber-400 text-[#0a0a0a] font-bold text-sm w-9 h-9 flex shrink-0 items-center justify-center rounded-sm">
                {userInitials}
              </div>
              {(!isCollapsed || mobileOpen) && (
                <div className="flex flex-col min-w-0">
                  <span className="text-zinc-300 text-sm font-medium leading-none mb-1.5 truncate">{user?.name || user?.email || 'User'}</span>
                  <span className="text-zinc-600 text-xs leading-none truncate">{user?.email || ''}</span>
                </div>
              )}
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="text-zinc-600 shrink-0">
                <Settings className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
