import { Button } from "@/components/ui/button";
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Props {
  profileData?: any;
  setShowBuyCreditsModal: Function;
}

const CreditsDetailsTab = (props: Props) => {
  const { profileData, setShowBuyCreditsModal } = props;
  const { credits } = profileData;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">Credits</h2>

      <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
        {/* Summary */}
        <div className="mb-4 space-y-1">
          <div>
            <strong>Current Credits:</strong>{" "}
            <span className="font-bold">{credits?.current_credits ?? 0}</span>
          </div>
          <div>
            <strong>Total Earned This Month:</strong>{" "}
            <span className="font-bold">
              {credits?.total_earned_this_month ?? 0}
            </span>
          </div>
          <div>
            <strong>Total Spent This Month:</strong>{" "}
            <span className="font-bold">
              {credits?.total_spent_this_month ?? 0}
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <h3 className="text-lg font-semibold mb-3">Credits Transactions</h3>
        <div className="overflow-x-auto">
          <Table className="w-full border border-border text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="border font-semibold text-foreground">
                  Reason
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
                  Type
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
                  Credits
                </TableHead>
                <TableHead className="border font-semibold text-foreground">
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
                  .map((activity: any) => (
                    <TableRow key={activity.id}>
                      <TableCell className="border">
                        {activity.reason}
                      </TableCell>
                      <TableCell className="border capitalize">
                        {activity.action_type}
                      </TableCell>
                      <TableCell className="border">
                        {activity.amount_changed}
                      </TableCell>
                      <TableCell className="border">
                        {/* {new Date(activity.created_at).toLocaleString()} */}
                        {format(new Date(activity.created_at), "dd MMM yyyy")}
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

        {/* Pagination Placeholder */}
        {/* <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>Showing latest transactions</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div> */}

        {/* Buy Credits Section */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">
            Note: Payment will be charged to your attached payment method. To
            use a different card, update your payment method in the Billing tab.
          </p>
          <Button onClick={() => setShowBuyCreditsModal(true)}>
            Buy Credits
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CreditsDetailsTab;
