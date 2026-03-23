import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile, Quest } from "../backend.d";
import { useActor } from "./useActor";

export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: false,
  });
}

export function useQuest() {
  const { actor, isFetching } = useActor();
  return useQuery<Quest>({
    queryKey: ["quest"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getQuest();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInitializeProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (weight: number) => {
      if (!actor) throw new Error("No actor");
      await actor.initializeProfile(BigInt(Math.round(weight)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["quest"] });
    },
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskName: string) => {
      if (!actor) throw new Error("No actor");
      await actor.completeTask(taskName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["quest"] });
    },
  });
}
