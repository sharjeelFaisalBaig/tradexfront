import Loader from "@/components/common/Loader";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/common/DatePicker";
import { format } from "date-fns";
import {
  useGetBillingHistory,
  useGetFilterOptions,
} from "@/hooks/auth/useAuth";

interface Props {
  profileData?: any;
}

const BillingDetailsTab = (props: Props) => {
  const { profileData } = props;
  const { permissions } = profileData;
  const [filters, setFilters] = useState({
    purpose: "",
    status: "",
    start_date: "",
    end_date: "",
    per_page: 10,
    page: 1,
  });

  // Use TanStack Query for billing history
  const {
    data: billingHistoryResponse,
    isLoading: isBillingLoading,
    isFetching: isBillingFetching,
  } = useGetBillingHistory(filters);

  // Use TanStack Query for filter options
  const { data: filterOptions, isLoading: isOptionsLoading } =
    useGetFilterOptions();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <>
      {/* <section>
        <h2 className="text-xl font-semibold mb-6">Permissions</h2>
        <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
          <div>
            Can Subscribe: <b>{permissions?.can_subscribe ? "Yes" : "No"}</b>
          </div>
          {permissions?.subscription_block_reason && (
            <div className="text-red-600 mt-2">
              Block Reason: {permissions.subscription_block_reason}
            </div>
          )}
        </div>
      </section> */}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-6">Billing History</h2>
        <div className="flex items-center justify-center">
          <div className="dark:border dark:border-gray-800 bg-white dark:bg-background rounded-lg shadow-lg p-6 w-full max-w-6xl">
            <div className="flex gap-4 mb-4">
              <Select
                onValueChange={(value) => handleFilterChange("purpose", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.data?.purposes?.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.data?.statuses?.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DatePicker
                date={
                  filters.start_date ? new Date(filters.start_date) : undefined
                }
                setDate={(date) =>
                  handleFilterChange(
                    "start_date",
                    date ? format(date, "yyyy-MM-dd") : ""
                  )
                }
                placeholder="Start Date"
              />
              <DatePicker
                date={filters.end_date ? new Date(filters.end_date) : undefined}
                setDate={(date) =>
                  handleFilterChange(
                    "end_date",
                    date ? format(date, "yyyy-MM-dd") : ""
                  )
                }
                placeholder="End Date"
              />
            </div>
            {isBillingLoading || isBillingFetching ? (
              <Loader />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-2 border">Payment Method</th>
                      {/* <th className="p-2 border">Reference ID</th> */}
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Type</th>
                      <th className="p-2 border">Currency</th>
                      <th className="p-2 border">Amount Paid</th>
                      <th className="p-2 border">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistoryResponse?.data?.billing_history?.map(
                      (entry: any) => (
                        <tr key={entry.id} className="border-t">
                          <td className="p-2 border">STRIPE</td>
                          {/* <td className="p-2 border">{entry.transaction_id}</td> */}
                          <td className="p-2 border">
                            {new Date(entry.processed_at).toLocaleDateString()}
                          </td>
                          <td className="p-2 border capitalize">
                            {String(entry.payment_purpose).replaceAll("_", " ")}
                          </td>
                          <td className="p-2 border uppercase">
                            {entry.currency}
                          </td>
                          <td className="p-2 border">{entry.amount ?? "-"}</td>
                          <td className="p-2 border">{entry.description}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <Select
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: Number(value),
                    page: 1,
                  }))
                }
                defaultValue={String(filters.per_page)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10/page</SelectItem>
                  <SelectItem value="25">25/page</SelectItem>
                  <SelectItem value="50">50/page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={
                    billingHistoryResponse?.data?.pagination?.current_page === 1
                  }
                >
                  Prev
                </Button>
                <span>
                  Page {billingHistoryResponse?.data?.pagination?.current_page}{" "}
                  of {billingHistoryResponse?.data?.pagination?.last_page}
                </span>
                <Button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={
                    billingHistoryResponse?.data?.pagination?.current_page ===
                    billingHistoryResponse?.data?.pagination?.last_page
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BillingDetailsTab;
