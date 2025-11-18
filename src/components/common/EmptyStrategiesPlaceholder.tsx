import React from "react";
import { useCreateStrategy } from "@/hooks/strategy/useStrategyMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { showAPIErrorToast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import Image from "next/image";
import Loader from "./Loader";

const EmptyStrategiesPlaceholder = ({
  title = "You haven’t created any strategies yet.",
  description = "Start by creating your first strategy to begin trading with Tradex AI.",
  hideButton = false,
}: {
  title?: string;
  description?: string;
  hideButton?: boolean;
}) => {
  const router = useRouter();
  const successNote = useSuccessNotifier();

  // mutations
  const { mutate: createStrategy, isPending: isCreatingStrategy } =
    useCreateStrategy();

  const handleCreateStrategy = async () => {
    createStrategy(
      {}, // payload
      {
        onSuccess: (data: any) => {
          successNote({
            title: "Strategy Created",
            description: `Strategy "${data?.data?.name}" created successfully.`,
          });
          router.push(`/strategies/${data?.data?.id}`);
        },
        onError: (error) => {
          showAPIErrorToast(error);
        },
      }
    );
  };

  return (
    <>
      {isCreatingStrategy && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb]/80 dark:bg-gray-900/80 z-50"
        >
          <Loader text="Please wait, creating strategy..." />
        </div>
      )}

      <section className="flex flex-col items-center justify-center text-center p-4">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          {title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
        <Image
          src="/strategy.svg"
          alt="Strategy"
          width={100}
          height={100}
          className="my-4"
        />
        {!hideButton && (
          <Button
            variant="secondary"
            disabled={isCreatingStrategy}
            onClick={handleCreateStrategy}
          >
            {isCreatingStrategy ? (
              <Loader direction="row" text="Creating strategy..." size="sm" />
            ) : (
              "Create Strategy"
            )}
          </Button>
        )}
      </section>
    </>
  );
};

export default EmptyStrategiesPlaceholder;
