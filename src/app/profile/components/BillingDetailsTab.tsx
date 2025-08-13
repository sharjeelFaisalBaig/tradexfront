import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useGetBillingHistory } from "@/hooks/auth/useAuth";
import { format } from "date-fns";
import Loader from "@/components/common/Loader";

const BillingDetailsTab = () => {
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
  });

  // Billing history API
  const {
    data: billingHistoryResponse,
    isLoading: isBillingLoading,
    isFetching: isBillingFetching,
  } = useGetBillingHistory({
    page: filters.page,
    per_page: filters.perPage,
  });

  // Extract correct data from API structure
  const billingData = billingHistoryResponse?.data?.billing_history ?? [];
  const pagination = billingHistoryResponse?.data?.pagination ?? {};
  const totalRecords = pagination?.total ?? 0;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Billing History</h2>

      {(isBillingLoading || isBillingFetching) && (
        <div className="flex justify-center py-6">
          <Loader />
        </div>
      )}

      {!isBillingLoading && billingData.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No billing history found.
        </div>
      )}

      {!isBillingLoading && !isBillingFetching && billingData.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="w-full border border-border text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="border font-semibold text-foreground">
                  Date
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
                  Plan
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
                  Amount
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="border">
                    {item.processed_at
                      ? format(new Date(item.processed_at), "dd MMM yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="border">
                    {item.membership_plan?.name ?? "-"}
                  </TableCell>
                  <TableCell className="border">
                    {item.amount
                      ? `$${parseFloat(item.amount).toFixed(2)} ${
                          item.currency?.toUpperCase() ?? ""
                        }`
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={
                      item.payment_status === "succeeded"
                        ? "text-green-600 font-semibold border"
                        : "text-red-600 font-semibold border"
                    }
                  >
                    {item.payment_status ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalRecords > filters.perPage && (
        <div className="flex justify-end mt-4 gap-2 items-center">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={filters.page === 1}
          >
            Previous
          </button>
          <span className="px-4 py-1">
            Page {filters.page} of {pagination?.last_page ?? 1}
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={filters.page >= (pagination?.last_page ?? 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BillingDetailsTab;
