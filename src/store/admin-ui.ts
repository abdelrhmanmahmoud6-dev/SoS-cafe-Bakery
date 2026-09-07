"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Admin UI preferences shared across the dashboard.
 *
 * The sound toggle lives in the header (AdminShell) but the alert fires from
 * the orders board, so the preference cannot be local component state. It is
 * persisted so a shift change doesn't silently start with alerts off.
 */
interface AdminUiState {
  soundOn: boolean;
  /** Set once the AudioContext has been unlocked by a real user gesture. */
  audioUnlocked: boolean;
  setSoundOn: (on: boolean) => void;
  markAudioUnlocked: () => void;
}

export const useAdminUi = create<AdminUiState>()(
  persist(
    (set) => ({
      soundOn: true,
      audioUnlocked: false,
      setSoundOn: (soundOn) => set({ soundOn }),
      markAudioUnlocked: () => set({ audioUnlocked: true }),
    }),
    {
      name: "sos-admin-ui",
      storage: createJSONStorage(() => localStorage),
      // Never persist the unlock flag: autoplay permission does not survive a
      // reload, so restoring `true` would wrongly hide the "enable" prompt.
      partialize: (s) => ({ soundOn: s.soundOn }),
    }
  )
);
