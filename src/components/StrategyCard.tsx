"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PencilLine, Star, Trash2 } from "lucide-react";
import Clipboard from "@/icons/double.svg";
import Link2 from "@/icons/sharegreen.svg";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IStrategy } from "@/lib/types";

interface StrategyCardProps {
  isFavorite: boolean;
  strategy: IStrategy;
  onClick: (data: IStrategy) => void;
  onEdit?: (data: IStrategy) => void;
  onCopy?: (data: IStrategy) => void;
  onShare?: (data: IStrategy) => void;
  onDelete?: (data: IStrategy) => void;
  toggleStar: (data: IStrategy, isFavorite: boolean) => void;
}

const StrategyCard = (props: StrategyCardProps) => {
  const {
    strategy,
    isFavorite,
    onClick,
    onEdit,
    onCopy,
    onShare,
    onDelete,
    toggleStar,
  } = props;

  strategy.tags = Array.isArray(strategy?.tags)
    ? strategy?.tags
    : JSON.parse(strategy?.tags || "[]");

  return (
    <Card
      key={strategy.id}
      onClick={() => onClick(strategy)}
      className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]"
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mt-8 px-5">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            {strategy.name}
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(strategy);
                }}
                className="cursor-pointer"
              >
                <PencilLine className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(strategy);
                }}
                className="cursor-pointer"
              >
                <Trash2 color="red" className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-5 pt-1 pb-2">
          {strategy?.tags
            ? strategy?.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs mr-1">
                  {tag}
                </Badge>
              ))
            : ""}
        </div>

        <div className="aspect-video px-5 mb-4">
          <Image
            src={
              "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop"
            }
            alt={strategy.name}
            width={400}
            height={200}
            className="w-full h-full object-cover rounded-[10px]"
            unoptimized // Optional: if you're loading from external URLs and don't want to configure a loader
          />
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Modified at {new Date(strategy.updated_at).toLocaleDateString()}
            </span>
            <div className="flex items-center space-x-2">
              <button
                className="h-6 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(strategy, !isFavorite);
                }}
              >
                <Star
                  className="h-6 w-5 transition-all duration-200"
                  style={{
                    fill: isFavorite ? "#00AA67" : "none",
                    stroke: "#00AA67",
                  }}
                  strokeWidth={1.7}
                />
              </button>

              <button
                className="h-6 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  // Do copy or whatever
                  onCopy?.(strategy);
                }}
              >
                <Clipboard className="h-6 w-5" />
              </button>
              <button
                className="h-6 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  // Do Like or whatever
                  onShare?.(strategy);
                }}
              >
                <Link2 className="h-6 w-5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyCard;
