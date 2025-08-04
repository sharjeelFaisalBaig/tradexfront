"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SearchIcon from "@/icons/search.svg";
import StrategyCard from "@/components/StrategyCard";
import { IStrategy } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useGetStrategies } from "@/hooks/strategy/useStrategyQueries";
import Loader from "@/components/common/Loader";
import { Pagination } from "@/components/common/Pagination";
import NewStrategyModal from "@/components/modal/NewStrategyModal";
import DeleteStrategyModal from "@/components/modal/DeleteStrategyModal";
import {
  useCopyStrategy,
  useFavouriteStrategy,
} from "@/hooks/strategy/useStrategyMutations";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { showAPIErrorToast } from "@/lib/utils";

const Strategies = () => {
  const router = useRouter();
  const successNote = useSuccessNotifier();

  // mutations
  const { mutate: copyStrategy } = useCopyStrategy();
  const { mutate: toggleFavouriteStrategy } = useFavouriteStrategy();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isForEdit, setIsForEdit] = useState<boolean>(false);
  const [isForDelete, setIsForDelete] = useState<boolean>(false);
  const [favStrategies, setFavStrategies] = useState<IStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<IStrategy | null>(
    null
  );

  const { data, isLoading, isError, error } = useGetStrategies();
  const strategies: IStrategy[] = useMemo(
    () => data?.data?.strategies || [],
    [data]
  );

  useEffect(() => {
    if (error) {
      toast({
        title: error?.message || "Error",
        // @ts-ignore
        description: error?.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    }
  }, [error]);

  useEffect(() => {
    strategies?.map((s) => {
      if (s?.collaborators?.[0]?.is_favourite) {
        setFavStrategies((prev) => [...prev, s]);
      }
    });
  }, [strategies]);

  // Filter based on search
  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) =>
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [strategies, searchTerm]);

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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
              <Input
                type="text"
                placeholder="Search strategies"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <Select defaultValue="10">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="modified">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modified">
                    Sort by: Last Modified
                  </SelectItem>
                  <SelectItem value="name">Sort by: Name</SelectItem>
                  <SelectItem value="created">Sort by: Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="h-4/5 flex items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
              <Loader text="Loading strategies..." />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-6">
              <span className="text-red-600 text-lg font-semibold">
                Failed to load strategies.
              </span>
              <br />
              <span className="text-red-600 text-lg font-semibold">
                {
                  // @ts-ignore
                  error?.response?.data?.message
                }
              </span>
            </div>
          ) : (
            <>
              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredStrategies.map((strategy) => {
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
                      toggleStar={() => handleToggleIsFavourite(strategy)}
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

              {/* Pagination */}
              {/* <Pagination
            totalPages={10}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          /> */}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Strategies;
