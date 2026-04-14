import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Session } from "@/types/api";

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  sessions: Session[];
  addSession: (session: Session) => void;
  setSessions: (sessions: Session[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  currentSessionId: string | null;
  clearStore: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      sessions: [],
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      setSessions: (sessions) => set({ sessions }),
      currentSessionId: null,
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      clearStore: () => set({ user: null, sessions: [], currentSessionId: null }),
    }),
    {
      name: "joblyser-storage",
    }
  )
);
