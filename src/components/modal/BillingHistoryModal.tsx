"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetchWithAutoRefresh } from "@/lib/fetchWithAutoRefresh";
import { endpoints } from "@/lib/endpoints";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Loader from "../common/Loader";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function DatePicker({
  date,
  setDate,
  placeholder,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function BillingHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    purpose: "",
    status: "",
    start_date: "",
    end_date: "",
    per_page: 10,
    page: 1,
  });
  const [filterOptions, setFilterOptions] = useState<any>({
    purposes: [],
    statuses: [],
  });

  const fetchBillingHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, String(value));
        }
      });
      const data = await fetchWithAutoRefresh(
        `${endpoints.BILLING.HISTORY}?${params.toString()}`,
        session
      );
      if (data?.status) {
        setBillingHistory(data.data.billing_history);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch billing history", error);
    }
    setLoading(false);
  };

  const fetchFilterOptions = async () => {
    try {
      const data = await fetchWithAutoRefresh(
        endpoints.BILLING.FILTER_OPTIONS,
        session
      );
      if (data?.status) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch filter options", error);
    }
  };

  useEffect(() => {
    if (isOpen && session) {
      fetchBillingHistory();
      fetchFilterOptions();
    }
  }, [isOpen, session, filters.page, filters.per_page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchBillingHistory();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="dark:border dark:border-gray-800 bg-white dark:bg-background rounded-lg shadow-lg p-6 w-full max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold">
              Billing History
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <Select
              onValueChange={(value) => handleFilterChange("purpose", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.purposes.map((opt: any) => (
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
                {filterOptions.statuses.map((opt: any) => (
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
            <Button onClick={handleApplyFilters}>Apply</Button>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-2 border">Payment Method</th>
                    <th className="p-2 border">Reference ID</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Currency</th>
                    <th className="p-2 border">Amount Paid</th>
                    <th className="p-2 border">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((entry) => {
                    // console.log({entry});
                    return (
                    <tr key={entry.id} className="border-t">
                      {/* <td className="p-2 border">{entry.transaction_type}</td> */}
                      <td className="p-2 border">STRIPE</td>
                      <td className="p-2 border">{entry.transaction_id}</td>
                      <td className="p-2 border">
                        {new Date(entry.processed_at).toLocaleDateString()}
                      </td>
                      <td className="p-2 border capitalize">{String(entry.payment_purpose).replaceAll('_',' ')}</td>
                      <td className="p-2 border uppercase">{entry.currency}</td>
                      <td className="p-2 border">${entry.amount}</td>
                      <td className="p-2 border">{entry.description}</td>
                    </tr>
                  )})}
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
                disabled={pagination.current_page === 1}
              >
                Prev
              </Button>
              <span>
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <Button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
