"use client";
import { Card, CardContent } from "@/components/ui/card";
import React, { useMemo } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import Link from "next/link";
import { format } from "date-fns";
import Loader from "../common/Loader";

interface Props {
  isLoading?: boolean;
  profileData?: any;
}

const RecentCreditsCard = (props: Props) => {
  const { isLoading, profileData } = props;
  const credits = useMemo(() => profileData?.credits, [profileData]);

  return (
    <Card
      className={`p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg`}
    >
      <CardContent className="p-0">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
          Recent Credits Transactions
        </h3>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader size={"md"} />
          </div>
        )}

        {!isLoading && credits?.recent_activities?.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No recent credits transactions found.
          </div>
        )}

        {!isLoading && credits?.recent_activities?.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4">
              <Table className="w-full border border-border text-xs">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Reason
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Type
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Credits
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits?.recent_activities?.length > 0 ? (
                    credits.recent_activities
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .slice(0, 4)
                      .map((activity: any) => (
                        <TableRow key={activity.id}>
                          <TableCell className="border p-3">
                            {activity.reason}
                          </TableCell>
                          <TableCell className="border p-3 capitalize">
                            {activity.action_type}
                          </TableCell>
                          <TableCell className="border p-3">
                            {activity.amount_changed}
                          </TableCell>
                          <TableCell className="border p-3">
                            {/* {new Date(activity.created_at).toLocaleString()} */}
                            {format(
                              new Date(activity.created_at),
                              "dd MMM yyyy"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell className="p-2 text-center" colSpan={4}>
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Link href="/profile?tab=credits">
              <Button size="sm">View all</Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentCreditsCard;
