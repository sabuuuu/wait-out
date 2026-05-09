import { useMutation } from "@tanstack/react-query";
import { triggerModelTraining } from "@/lib/ml-train";
import { WishlistItem } from "@/lib/types";

export function useML() {
  const trainMutation = useMutation({
    mutationFn: async ({ userId, items }: { userId: string; items: WishlistItem[] }) => {
      return await triggerModelTraining(userId, items);
    },
    onSuccess: (data) => {
      if (data.status === "training_triggered") {
        console.log("🎉 ML Model training triggered successfully with", data.n, "samples");
      }
    },
    onError: (error) => {
      console.error("Failed to trigger ML training via mutation:", error);
    },
  });

  return {
    triggerTraining: trainMutation.mutateAsync,
    isTraining: trainMutation.isPending,
  };
}
