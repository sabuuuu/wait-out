import { useMutation } from "@tanstack/react-query";
import { triggerModelTraining } from "@/lib/ml-train";
import { WishlistItem } from "@/lib/types";

export function useML() {
  const trainMutation = useMutation({
    mutationFn: async ({ items }: { items: WishlistItem[] }) => {
      return await triggerModelTraining(items);
    },
    // Training is a background fire-and-forget operation — failures are
    // silent by design. The V1 score is always the fallback.
  });

  return {
    triggerTraining: trainMutation.mutateAsync,
    isTraining: trainMutation.isPending,
  };
}
