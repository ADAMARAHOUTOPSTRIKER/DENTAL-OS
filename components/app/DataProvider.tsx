"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchClinicData, SEED, type ClinicData } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Patient } from "@/lib/data";

interface DataStore extends ClinicData {
  loading: boolean;
  source: "supabase" | "seed";
  patientById: (id: string) => Patient | undefined;
}

const Ctx = createContext<DataStore | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Start from seed so the UI paints immediately, then hydrate from Supabase.
  const [data, setData] = useState<ClinicData>(SEED);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [source, setSource] = useState<"supabase" | "seed">(
    isSupabaseConfigured ? "supabase" : "seed"
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchClinicData()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setSource("supabase");
      })
      .catch(() => alive && setSource("seed"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<DataStore>(
    () => ({
      ...data,
      loading,
      source,
      patientById: (id: string) => data.patients.find((p) => p.id === id),
    }),
    [data, loading, source]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
