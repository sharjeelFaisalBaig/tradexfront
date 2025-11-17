"use client";

import { X } from "lucide-react";
import { Folder, IStrategy } from "@/lib/types";
import { useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { useGetStrategies } from "@/hooks/strategy/useStrategyQueries";
import StrategyCardForSelect from "../StrategyCardForSelect";
import useSuccessNotifier from "@/hooks/useSuccessNotifier";
import { Input } from "@/components/ui/input";
import SearchIcon from "@/icons/search.svg";
import Loader from "../common/Loader";
import { useMoveStrategyToFolder } from "@/hooks/folder/useFolderMutations";
import { showAPIErrorToast } from "@/lib/utils";

export default function SelectStrategiesModal({
  isOpen,
  onClose,
  selectedFolder,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder?: Folder | null;
}) {
  const successNote = useSuccessNotifier();
  const { mutate: moveStrategyToFolder, isPending: isMoving } =
    useMoveStrategyToFolder();

  const { data, isLoading: isLoadingStrategies } = useGetStrategies({
    search: "",
    sort_by: "updated_at",
    sort_order: "desc",
  });

  const strategies: IStrategy[] = useMemo(
    () =>
      data?.data?.strategies?.sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ) || [],
    [data]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<IStrategy[]>([]);

  const handleSelectStrategy = (strategy: IStrategy) => {
    const isAlreadySelected = selectedStrategies.some(
      (s) => s.id === strategy.id
    );

    if (isAlreadySelected) {
      setSelectedStrategies((prev) => prev.filter((s) => s.id !== strategy.id));
    } else {
      setSelectedStrategies((prev) => [...prev, strategy]);
    }
  };

  const handleMoveStrategiesToFolder = () => {
    moveStrategyToFolder(
      {
        strategyId: selectedStrategies[0].id,
        folder_id: selectedFolder?.id || "",
      },
      {
        onSuccess: () => {
          successNote({
            title: "Success",
            description: `${selectedStrategies.length} strategies moved successfully.`,
          });
          onClose();
        },
        onError: (err) => {
          showAPIErrorToast(err);
        },
      }
    );
  };

  const filteredStrategies = useMemo(() => {
    if (!searchTerm.trim()) return strategies;

    const lower = searchTerm.toLowerCase();

    return strategies.filter((s) => {
      const nameMatch = s.name?.toLowerCase().includes(lower);
      return nameMatch;
    });
  }, [searchTerm, strategies]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="relative dark:border dark:border-gray-800 bg-white dark:bg-background w-full max-w-2xl mx-auto rounded-lg shadow-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <Dialog.Title className="text-xl font-semibold text-left p-4 !pb-2">
            Select Strategies
          </Dialog.Title>

          <div className="px-4 flex flex-col gap-2 h-80 overflow-y-auto">
            {/* Search */}
            <div className="w-full py-2 sticky top-0 bg-white dark:bg-background z-20">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
              <Input
                type="text"
                placeholder="Search strategies by name or tag"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoadingStrategies && (
              <div className="flex justify-center py-10">
                <Loader size={"md"} />
              </div>
            )}

            {!isLoadingStrategies && filteredStrategies.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No strategies found{" "}
                {searchTerm ? `matching "${searchTerm}"` : ""}
              </div>
            )}

            {!isLoadingStrategies && strategies.length > 0 && (
              <>
                {filteredStrategies.map((strategy) => {
                  return (
                    <StrategyCardForSelect
                      key={strategy.id}
                      strategy={strategy}
                      onClick={() => handleSelectStrategy(strategy)}
                      isSelected={selectedStrategies.some(
                        (s) => s.id === strategy.id
                      )}
                    />
                  );
                })}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-gray-500">
              {selectedStrategies.length} strateg
              {selectedStrategies.length === 0 ||
              selectedStrategies.length === 1
                ? "y"
                : "ies"}{" "}
              selected
            </p>
            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" className="text-base">
                Cancel
              </Button>
              <Button
                className="text-base px-6"
                onClick={handleMoveStrategiesToFolder}
                disabled={selectedStrategies.length === 0 || isMoving}
              >
                {isMoving ? "Moving..." : "Done"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
