"use client";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
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
import { useGetBillingHistory } from "@/hooks/auth/useAuth";
import Loader from "../common/Loader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  isLoading?: boolean;
  profileData?: any;
}

const BillingHistoryCard = (props: Props) => {
  const { isLoading, profileData } = props;

  // Billing history API
  const {
    data: billingHistoryResponse,
    isLoading: isBillingLoading,
    isFetching: isBillingFetching,
  } = useGetBillingHistory({
    page: 1,
    // per_page: 4,
  });

  // Extract correct data from API structure
  const billingData =
    billingHistoryResponse?.data?.billing_history?.slice(0, 4) ?? [];

  return (
    <Card
      className={`p-5 group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg`}
    >
      <CardContent className="p-0">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
          Billing History
        </h3>

        {(isBillingLoading || isBillingFetching) && (
          <div className="flex justify-center py-10">
            <Loader size={"md"} />
          </div>
        )}

        {!isBillingLoading && billingData.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No billing history found.
          </div>
        )}

        {!isBillingLoading && !isBillingFetching && billingData.length > 0 && (
          <>
            <div className="overflow-x-auto mb-4">
              <Table className="w-full border border-border text-xs">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Date
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Plan
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Amount
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Payment Method
                    </TableHead>
                    <TableHead className="border font-semibold text-foreground p-3">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="border p-3">
                        {item.processed_at
                          ? format(new Date(item.processed_at), "dd MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="border p-3">
                        {item.membership_plan?.name ?? "-"}
                      </TableCell>
                      <TableCell className="border p-3">
                        {item.amount
                          ? `$${parseFloat(item.amount).toFixed(2)} ${
                              item.currency?.toUpperCase() ?? ""
                            }`
                          : "-"}
                      </TableCell>
                      <TableCell className="border p-3">
                        {item.payment_method
                          ? `${
                              item.payment_method.brand?.toUpperCase() ?? ""
                            } ••••${item.payment_method.last4 ?? ""}`
                          : "Stripe"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border p-3 font-semibold",
                          item.payment_status === "succeeded"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {item.payment_status ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Link href="/profile?tab=billing">
              <Button size="sm">View all</Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingHistoryCard;
