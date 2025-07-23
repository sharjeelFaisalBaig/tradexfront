"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const NotificationsPage = () => {
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className=" mx-auto bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="font-semibold text-lg">
                All Notifications
                <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                  4
                </span>
              </h3>
            </div>

            <div className="divide-y">
              {[
                { time: "Just now" },
                { time: "Yesterday" },
                { time: "2 days ago" },
                { time: "2 days ago" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 ${
                    item.time === "Just now" ? "bg-gray-100" : ""
                  }`}
                >
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <span className="text-[#00AA67] text-xl leading-none">
                      •
                    </span>
                    Commission received for unit #012
                    <span className="ml-auto text-xs text-gray-500">
                      {item.time}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    It is a long established fact that a reader will be
                    distracted by the readable content of a page.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
