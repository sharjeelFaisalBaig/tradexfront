"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StrategyCardProps {
  title: string;
  description: string;
}

const DashboardCard = (props: StrategyCardProps) => {
  const { title, description } = props;

  return (
    <Card
      key={`${title}-${new Date().getTime()}`}
      className="p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg"
    >
      <CardContent className="p-0">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
