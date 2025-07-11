import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStrategy,
  updateStrategy,
  copyStrategy,
  toggleStrategy,
  favouriteStrategy,
} from "@/services/strategy/strategy_Mutation";
import { IStrategy } from "@/lib/types";

export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IStrategy>) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};

export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IStrategy> }) =>
      updateStrategy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};

export const useCopyStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => copyStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};

export const useToggleStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleStrategy(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};

export const useFavouriteStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_favourite }: { id: string; is_favourite: boolean }) =>
      favouriteStrategy(id, is_favourite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};
