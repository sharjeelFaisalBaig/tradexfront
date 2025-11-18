"use client";

import { useState } from "react";
import EmptyStrategiesPlaceholder from "@/components/common/EmptyStrategiesPlaceholder";
import { useGetTemplates } from "@/hooks/template/useTemplateQueries";
import { Pagination } from "@/components/common/Pagination";
import TemplateCard from "@/components/TemplateCard";
import { getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";
import { Input } from "@/components/ui/input";
import SearchIcon from "@/icons/search.svg";
import _ from "lodash";

const staticTemplates = Array(6).fill({
  title: "YT Content System",
  description:
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  author: "John Smith",
  updated: "Updated 1 month ago",
  image:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
});

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [queryParams, setQueryParams] = useState<{
    search: string;
    sort_by: string;
    sort_order: "asc" | "desc";
  }>({
    search: "",
    sort_by: "updated_at",
    sort_order: "desc",
  });

  const { data, isLoading, isError, error } = useGetTemplates(queryParams);

  const templates = data?.data?.templates || [];

  console.log({ data });

  return (
    <>
      {/* Search & Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
          <Input
            type="text"
            placeholder="Search Templates"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2">
          <span className="text-xl">＋</span> New Board
        </Button>
      </div>

      {isLoading ? (
        <div className="h-4/5 flex items-center justify-center bg-[#f6f8fb] dark:bg-gray-900">
          <Loader text="Loading templates..." />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-6">
          <span className="text-red-600 text-lg font-semibold">
            {getApiErrorMessage(error) ?? "Failed to load templates."}
          </span>
        </div>
      ) : _.isEmpty(templates) ? (
        <EmptyStrategiesPlaceholder
          hideButton
          title="Templates not exists"
          description="Start by creating your first strategy to begin trading with Tradex AI."
          // title="You haven’t created any strategies yet."
          // description="Start by creating your first strategy to begin trading with Tradex AI."
        />
      ) : (
        <>
          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {templates.map((template: any, index: number) => {
              return (
                <TemplateCard
                  index={index}
                  template={template}
                  key={`template-${index}-${template?.id}`}
                />
              );
            })}
          </div>
          {/* Pagination */}
          <Pagination
            totalPages={10}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {staticTemplates
          .filter((t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((template, index) => (
            <TemplateCard
              index={index}
              template={template}
              key={`template-${index}-${template?.id}`}
            />
          ))}
      </div>
    </>
  );
}
