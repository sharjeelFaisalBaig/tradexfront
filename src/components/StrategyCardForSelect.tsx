"use client";

import { Card, CardContent } from "@/components/ui/card";
import { IStrategy } from "@/lib/types";
import { Check } from "lucide-react";

interface StrategyCardForSelectProps {
  isSelected?: boolean;
  strategy: IStrategy;
  onClick: (data: IStrategy) => void;
}

const StrategyCardForSelect = (props: StrategyCardForSelectProps) => {
  const { strategy, isSelected, onClick } = props;

  strategy.tags = Array.isArray(strategy?.tags)
    ? strategy?.tags
    : JSON.parse(strategy?.tags || "[]");

  return (
    <Card
      key={strategy.id}
      className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px] flex-shrink-0"
      onClick={() => onClick(strategy)}
    >
      <CardContent className="p-4 relative">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
          {strategy.name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>
            Created at {new Date(strategy.created_at).toLocaleDateString()}
          </span>
          <span>•</span>
          <span>
            Modified at {new Date(strategy.updated_at).toLocaleDateString()}
          </span>
        </div>

        <button
          aria-label="Select Strategy"
          className={`size-10 absolute top-1/2 -translate-y-1/2 right-4 rounded-full flex items-center justify-center p-1 ${
            isSelected
              ? " bg-blue-600 text-white"
              : "text-muted-foreground bg-foreground/5"
          }`}
        >
          <Check className="w-5 h-5" />
        </button>
      </CardContent>
    </Card>
  );
};

export default StrategyCardForSelect;
