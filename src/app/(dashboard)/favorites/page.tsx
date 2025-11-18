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
import { useGetFavouriteStrategies } from "@/hooks/strategy/useStrategyQueries";
import DeleteStrategyModal from "@/components/modal/DeleteStrategyModal";
import NewStrategyModal from "@/components/modal/NewStrategyModal";
import StrategyCard from "@/components/StrategyCard";
import Loader from "@/components/common/Loader";
import SearchIcon from "@/icons/search.svg";
import { IStrategy } from "@/lib/types";
import {
  useCopyStrategy,
  useFavouriteStrategy,
} from "@/hooks/strategy/useStrategyMutations";
import EmptyStrategiesPlaceholder from "@/components/common/EmptyStrategiesPlaceholder";
import ShareStrategyModal from "@/components/modal/ShareStrategyModal";
import { getApiErrorMessage, showAPIErrorToast } from "@/lib/utils";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import _ from "lodash";

type ModalType = "edit" | "delete" | "share" | "copy" | "";

const FavoriteStrategiesPage = () => {
  const router = useRouter();
  const successNote = useSuccessNotifier();

  const { mutate: copyStrategy, isPending: isLoadingCopy } = useCopyStrategy();
  const { mutate: toggleFavouriteStrategy } = useFavouriteStrategy();

  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalType>("");
  const [selectedStrategy, setSelectedStrategy] = useState<IStrategy | null>(
    null
  );

  const [sortOption, setSortOption] = useState<string>("last_modified");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const [strategyQueryParams, setStrategyQueryParams] = useState({
    search: "",
    sort_by: "updated_at",
    sort_order: "desc" as "asc" | "desc",
  });

  /** FETCH FAVORITE STRATEGIES */
  const { data, isLoading, isError, error } =
    useGetFavouriteStrategies(strategyQueryParams);

  const strategies: IStrategy[] = useMemo(
    () => data?.data?.favourite || [],
    [data]
  );

  /** HANDLE API ERRORS */
  useEffect(() => {
    if (error) {
      showAPIErrorToast(error);
      const errorMsg = String(getApiErrorMessage(error));
      if (errorMsg.includes("no available credits")) {
        router.push(`/profile?tab=credits`);
      }
    }
  }, [error]);

  /** DEBOUNCE SEARCH */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  /** UPDATE QUERY PARAMS */
  useEffect(() => {
    const sort_by = sortOption === "last_modified" ? "updated_at" : "name";
    const sort_order = sortOption === "name" ? "asc" : "desc";

    setStrategyQueryParams({
      search: debouncedSearch,
      sort_by,
      sort_order,
    });
  }, [debouncedSearch, sortOption]);

  /** CLIENT-SIDE FILTER AS EXTRA (name + tags) */
  const filteredStrategies = useMemo(() => {
    if (!debouncedSearch.trim()) return strategies;

    const query = debouncedSearch.toLowerCase();

    return strategies.filter((s) => {
      const name = s.name?.toLowerCase() || "";
      const tags = s.tags?.join(" ").toLowerCase() || "";
      return name.includes(query) || tags.includes(query);
    });
  }, [strategies, debouncedSearch]);

  const handleToggleIsFavourite = (strategy: IStrategy) => {
    // Show success toast immediately
    successNote({
      title: "Removed from Favourite",
      description: `“${strategy?.name}” has been removed from favourites.`,
    });
    // API call
    toggleFavouriteStrategy(
      { id: strategy?.id ?? "", is_favourite: false },
      {
        onError: (error) => {
          showAPIErrorToast(error);
        },
      }
    );
  };

  /** COPY STRATEGY */
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
    <>
      {modal === "share" && (
        <ShareStrategyModal
          isOpen
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}
      {modal === "edit" && (
        <NewStrategyModal
          isOpen
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}
      {modal === "delete" && (
        <DeleteStrategyModal
          isOpen
          strategy={selectedStrategy}
          onClose={() => setModal("")}
        />
      )}

      <main>
        {/* Loader Overlay */}
        {isLoadingCopy && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 flex items-center justify-center bg-[#f6f8fb]/80 dark:bg-gray-900/80 z-50"
          >
            <Loader text="Copying strategy..." />
          </div>
        )}

        {/* Search + Sort Controls */}
        <div className="flex items-center justify-between mb-6">
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

          <Select
            defaultValue="last_modified"
            onValueChange={(value) => setSortOption(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_modified">
                Sort by: Last Modified
              </SelectItem>
              <SelectItem value="name">Sort by: Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* MAIN CONTENT */}
        {isLoading ? (
          <div className="h-4/5 flex items-center justify-center">
            <Loader text="Loading favourite strategies..." />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isFavorite={true}
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
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default FavoriteStrategiesPage;
