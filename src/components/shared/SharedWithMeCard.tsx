"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Clipboard from "@/icons/double.svg";
import Image from "next/image";

interface Props {
  index: number;
  strategy: any;
  // strategy: IStrategy;
}
const SharedWithMeCard = (props: Props) => {
  const { strategy, index } = props;

  return (
    <Card className="group w-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]">
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className=" ">
          <Badge variant="secondary" className="text-xs">
            {strategy.category}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3">
        <Image
          src={strategy.image}
          alt={strategy.title}
          width={434}
          height={180}
          className="h-[200px] w-full object-cover rounded-xl"
          unoptimized
          priority={index === 0}
        />
      </div>

      <CardContent className="flex items-center justify-between px-5 pt-2">
        <div className="flex gap-3 items-center">
          <Star size={18} strokeWidth={2.2} className="mt-1 text-[#1a8cff]" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {strategy.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Opened {strategy.sharedAgo}
            </p>
          </div>
        </div>

        <Clipboard className="h-6 w-5" />
      </CardContent>
    </Card>
  );
};

export default SharedWithMeCard;
