"use client";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
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
import { getApiErrorMessage, showAPIErrorToast } from "@/lib/utils";
import EmptyStrategiesPlaceholder from "@/components/common/EmptyStrategiesPlaceholder";
import ShareStrategyModal from "@/components/modal/ShareStrategyModal";
import _ from "lodash";

type ModalType = "edit" | "delete" | "share" | "copy" | "";

const Strategies = () => {
  const router = useRouter();
  const successNote = useSuccessNotifier();
  // mutations
  const { mutate: copyStrategy, isPending: isLoadingCopy } = useCopyStrategy();
  const { mutate: toggleFavouriteStrategy } = useFavouriteStrategy();

  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalType>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [favStrategies, setFavStrategies] = useState<IStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<IStrategy | null>(
    null
  );
  const [sortOption, setSortOption] = useState<string>("modified"); // State for sort option

  const { data, isLoading, isError, error } = useGetStrategies();
  const strategies: IStrategy[] = useMemo(
    () => data?.data?.strategies || [],
    [data]
  );

  useEffect(() => {
    if (error) {
      // Show error toast with detailed message
      showAPIErrorToast(error);
      const errorMsg = String(getApiErrorMessage(error));
      if (errorMsg.includes("no available credits")) {
        router.push(`/profile?tab=credits`);
      }
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
  const filteredStrategies = strategies
    .filter((strategy) => {
      const nameMatches = strategy.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const tagsMatch = strategy.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return nameMatches || tagsMatch;
    })
    .sort((a, b) => {
      // Sorting logic based on the selected option
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "modified":
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {modal === "share" && (
        <ShareStrategyModal
          isOpen={modal === "share"}
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}
      {modal === "edit" && (
        <NewStrategyModal
          isOpen={modal === "edit"}
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}
      {modal === "delete" && (
        <DeleteStrategyModal
          isOpen={modal === "delete"}
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto p-6">
          {/* Loader Overlay */}
          {isLoadingCopy && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-[#f6f8fb]/80 dark:bg-gray-900/80 z-50"
            >
              <Loader text="Copy strategy..." />
            </div>
          )}
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative w-full max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
              <Input
                type="text"
                placeholder="Search strategies by name or tag"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filters */}
            <div className="flex items-center space-x-4">
              {/* <Select defaultValue="10">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select> */}
              <Select
                defaultValue="modified"
                onValueChange={(value) => setSortOption(value)}
              >
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
            <div className="flex items-center justify-center p-6">
              <span className="text-red-600 text-lg font-semibold">
                {getApiErrorMessage(error) ?? "Failed to load strategies."}
              </span>
            </div>
          ) : _.isEmpty(strategies) ? (
            <EmptyStrategiesPlaceholder />
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
                      onCopy={handleCopyStrategy}
                      toggleStar={handleToggleIsFavourite}
                      onClick={() => router.push(`/strategies/${strategy.id}`)}
                      onEdit={() => {
                        setModal("edit");
                        setSelectedStrategy(strategy);
                      }}
                      onDelete={() => {
                        setModal("delete");
                        setSelectedStrategy(strategy);
                      }}
                      onShare={() => {
                        setModal("share");
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
