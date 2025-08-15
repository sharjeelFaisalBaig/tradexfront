"use client";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "./Loader";

interface DashboardCardProps {
  title: string;
  description: string;
  className?: string;
  isLoading?: boolean;
}

const DashboardCard = ({
  title,
  description,
  className,
  isLoading,
}: DashboardCardProps) => {
  return (
    <Card
      className={`p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg ${className}`}
    >
      <CardContent className="p-0">
        <h3 className="font-semibold text-2xl text-gray-900 dark:text-white">
          {isLoading ? <Loader size="sm" text="" /> : title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
