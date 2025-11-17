"use client";
import { Card, CardContent } from "@/components/ui/card";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import Loader from "../common/Loader";
import { useGetStrategies } from "@/hooks/strategy/useStrategyQueries";
import { IStrategy } from "@/lib/types";
import StrategyCard from "../StrategyCard";
import { useRouter } from "next/navigation";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import {
  useCopyStrategy,
  useFavouriteStrategy,
} from "@/hooks/strategy/useStrategyMutations";
import { showAPIErrorToast } from "@/lib/utils";
import NewStrategyModal from "../modal/NewStrategyModal";
import DeleteStrategyModal from "../modal/DeleteStrategyModal";

interface Props {
  isLoading?: boolean;
  profileData?: any;
}

const RecentInteractedStrategiesCard = (props: Props) => {
  const { isLoading: isProfileLoading, profileData } = props;

  const router = useRouter();
  const successNote = useSuccessNotifier();

  const { data, isLoading: isLoadingStrategies } = useGetStrategies({
    search: "",
    sort_by: "updated_at",
    sort_order: "desc",
  });

  const strategies: IStrategy[] = useMemo(
    () =>
      data?.data?.strategies
        ?.sort(
          (a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        ?.slice(0, 3) || [],
    [data]
  );

  // states
  const [isForEdit, setIsForEdit] = useState<boolean>(false);
  const [isForDelete, setIsForDelete] = useState<boolean>(false);
  const [favStrategies, setFavStrategies] = useState<IStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<IStrategy | null>(
    null
  );

  // mutations
  const { mutate: copyStrategy, isPending: isLoadingCopy } = useCopyStrategy();
  const { mutate: toggleFavouriteStrategy } = useFavouriteStrategy();

  const handleToggleIsFavourite = (strategy: IStrategy) => {
    const newFavouriteState = !favStrategies?.some(
      (fav) => fav?.id === strategy?.id
    );
    // Optimistically update local favourite strategies
    setFavStrategies((prevFavs) => {
      if (newFavouriteState) {
        return [...prevFavs, strategy];
      } else {
        return prevFavs.filter((s) => s.id !== strategy.id);
      }
    });
    // Show success toast immediately
    successNote({
      title: newFavouriteState
        ? "Added to Favourite"
        : "Removed from Favourite",
      description: `“${strategy?.name}” has been ${
        newFavouriteState ? "added to" : "removed from"
      } favourites.`,
    });
    // API call
    toggleFavouriteStrategy(
      { id: strategy?.id ?? "", is_favourite: newFavouriteState },
      {
        onError: (error) => {
          showAPIErrorToast(error);
          // Revert local change on failure
          setFavStrategies((prevFavs) => {
            if (newFavouriteState) {
              // Revert add → remove again
              return prevFavs.filter((s) => s.id !== strategy.id);
            } else {
              // Revert remove → add again
              return [...prevFavs, strategy];
            }
          });
        },
      }
    );
  };

  const handleCopyStrategy = (strategy: IStrategy) => {
    copyStrategy(strategy?.id, {
      onSuccess: () => {
        successNote({
          title: "Strategy Copied",
          description: `“${strategy?.name}” has been successfully copied.`,
        });
      },
      onError: (error) => {
        showAPIErrorToast(error);
      },
    });
  };

  return (
    <section>
      {isForEdit && (
        <NewStrategyModal
          isOpen={isForEdit}
          strategy={selectedStrategy}
          onClose={() => setIsForEdit(false)}
        />
      )}
      {isForDelete && (
        <DeleteStrategyModal
          isOpen={isForDelete}
          strategy={selectedStrategy}
          onClose={() => setIsForDelete(false)}
        />
      )}

      {isLoadingCopy && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb]/80 dark:bg-gray-900/80 z-50"
        >
          <Loader text="Copying strategy..." />
        </div>
      )}

      <Card
        className={`p-5 group hover:shadow-lg transition-shadow overflow-hidden rounded-lg`}
      >
        <CardContent className="p-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
            Recent Interacted Strategies
          </h3>

          {isLoadingStrategies && (
            <div className="flex justify-center py-10">
              <Loader size={"md"} />
            </div>
          )}

          {!isLoadingStrategies && strategies.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No recent interacted strategies found.
            </div>
          )}

          {!isLoadingStrategies && strategies.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {strategies.map((strategy) => {
                  const isFavourite = favStrategies?.some(
                    (fav) => fav?.id === strategy?.id
                  );
                  return (
                    <StrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      isFavorite={isFavourite}
                      onClick={() => router.push(`/strategies/${strategy.id}`)}
                      onCopy={handleCopyStrategy}
                      toggleStar={() => {
                        handleToggleIsFavourite(strategy);
                      }}
                      onEdit={() => {
                        setIsForEdit(true);
                        setSelectedStrategy(strategy);
                      }}
                      onDelete={() => {
                        setIsForDelete(true);
                        setSelectedStrategy(strategy);
                      }}
                    />
                  );
                })}
              </div>
              <Link href="/strategies">
                <Button size="sm">View all</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default RecentInteractedStrategiesCard;
