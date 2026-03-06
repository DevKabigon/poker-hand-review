import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getProfileUsername } from "../db/profileService";

interface AuthState {
  user: User | null;
  username: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isGuest: boolean;
  setAuth: (user: User | null) => Promise<void>;
  setUsername: (username: string | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  username: null,
  isLoading: true,
  isInitialized: false,
  isGuest: false,

  setAuth: async (user: User | null) => {
    if (user) {
      let username: string | null = null;
      try {
        username = await getProfileUsername(user.id);
      } catch (error) {
        console.error("Failed to load profile username:", error);
      }

      set({ user, username, isGuest: false, isLoading: false });
    } else {
      set({ user: null, username: null, isGuest: true, isLoading: false });
    }
  },

  setUsername: (username: string | null) => {
    set({ username: username?.trim() || null });
  },

  initialize: async () => {
    if (get().isInitialized) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    let username: string | null = null;
    if (currentUser) {
      try {
        username = await getProfileUsername(currentUser.id);
      } catch (error) {
        console.error("Failed to load profile username:", error);
      }
    }

    set({
      user: currentUser,
      username,
      isInitialized: true,
      isLoading: false,
      isGuest: !currentUser,
    });

    supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      if (nextUser && get().user?.id !== nextUser.id) {
        await get().setAuth(nextUser);
      } else if (!nextUser) {
        await get().setAuth(null);
      }
    });
  },
}));
