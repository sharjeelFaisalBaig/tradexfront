"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Star from "@/icons/stargreen.svg";
import Clipboard from "@/icons/double.svg";
import Link2 from "@/icons/sharegreen.svg";
import { IStrategy } from "@/lib/types";
import { favouriteStrategy, copyStrategy } from "@/services/strategy/strategy_Mutation";
import ShareModal from "@/components/modal/ShareModal";
import ClientOnly from "./ClientOnly";

interface StrategyCardProps {
  strategy: IStrategy;
  isStarred: boolean;
  onStarToggle: () => void;
  onCopy: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isStarred, onStarToggle, onCopy }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]">
        <CardContent className="p-0">
          <div className="flex items-start justify-between mt-8 px-5">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {strategy.name}
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-5 pt-1 pb-2">
            {strategy.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs mr-1">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="aspect-video px-5 mb-4">
            <Image
              src={"https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop"}
              alt={strategy.name}
              width={400}
              height={200}
              className="w-full h-full object-cover rounded-[10px]"
              unoptimized
            />
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <ClientOnly>
                <span>Last edited {new Date(strategy.updated_at).toLocaleDateString()}</span>
              </ClientOnly>
              <div className="flex items-center space-x-2">
                <button
                  className="h-6 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStarToggle();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill={isStarred ? "#00AA67" : "none"}
                    className="h-6 w-5"
                    style={{
                      stroke: "#00AA67",
                    }}
                  >
                    <path
                      strokeWidth="1.7"
                      d="M8.39 4.958C9.553 2.875 10.133 1.833 11 1.833s1.449 1.042 2.61 3.125l.3.539c.33.591.495.887.752 1.083s.578.267 1.219.412l.583.132c2.255.51 3.382.766 3.65 1.628.268.863-.5 1.761-2.037 3.559l-.398.465c-.437.51-.655.766-.753 1.082-.099.316-.066.657 0 1.338l.06.62c.233 2.399.35 3.598-.353 4.13-.702.534-1.758.048-3.869-.924l-.546-.252c-.6-.276-.9-.414-1.218-.414s-.618.138-1.218.414l-.546-.252c-2.11.972-3.166 1.458-3.869.925-.702-.533-.586-1.732-.353-4.13l.06-.62c.066-.682.099-1.023 0-1.34-.098-.315-.316-.57-.753-1.081l-.397-.465c-1.538-1.798-2.306-2.696-2.038-3.559.268-.862 1.396-1.118 3.65-1.628l.584-.132c.64-.145.96-.217 1.218-.412.257-.196.422-.492.752-1.083z"
                    />
                  </svg>
                </button>

                <Clipboard
                  className="h-6 w-5"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                />
                <Link2 className="h-6 w-5" onClick={handleShareClick} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <ShareModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        strategy={strategy}
      />
    </>
  );
};

export default StrategyCard;