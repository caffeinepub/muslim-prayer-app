import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrayerSettings, TasbihCounter } from "../backend.d";
import { useActor } from "./useActor";

export function useGetPrayerSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<PrayerSettings | null>({
    queryKey: ["prayerSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPrayerSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePrayerSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: PrayerSettings) => {
      if (!actor) throw new Error("No actor");
      return actor.savePrayerSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayerSettings"] });
    },
  });
}

export function useGetTasbihCounters() {
  const { actor, isFetching } = useActor();
  return useQuery<TasbihCounter[]>({
    queryKey: ["tasbihCounters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerTasbihCounters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTasbihCounter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (counter: TasbihCounter) => {
      if (!actor) throw new Error("No actor");
      return actor.addOrUpdateTasbihCounter(counter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasbihCounters"] });
    },
  });
}

export function useIncrementTasbihCounter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.incrementTasbihCounter(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasbihCounters"] });
    },
  });
}

export function useResetTasbihCounter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.resetTasbihCounter(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasbihCounters"] });
    },
  });
}

export function useDeleteTasbihCounter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTasbihCounter(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasbihCounters"] });
    },
  });
}
