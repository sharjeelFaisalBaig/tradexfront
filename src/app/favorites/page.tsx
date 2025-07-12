"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFavoriteStrategies } from "@/services/strategy/strategy_API";
import {
  favouriteStrategy,
  copyStrategy,
} from "@/services/strategy/strategy_Mutation";
import { IStrategy } from "@/lib/types";
import SearchIcon from "@/icons/search.svg";
import Star from "@/icons/stargreen.svg";
import Clipboard from "@/icons/double.svg";
import Link2 from "@/icons/sharegreen.svg";
import Image from "next/image";
import Loader from "@/components/common/Loader";

const Favorites = () => {
  const { data: session } = useSession();
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [starredItems, setStarredItems] = useState<boolean[]>([]);
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [perPage, setPerPage] = useState(10);

  const fetched = useRef(false);
  const isInitialMount = useRef(true);

  const fetchStrategies = async () => {
    if (session) {
      try {
        setLoading(true);
        const res = await getFavoriteStrategies(session, {
          sort_by: sortBy,
          sort_order: sortOrder,
          per_page: perPage,
          search: searchTerm,
        });
        setStrategies(res.data.strategies);
        setStarredItems(
          res.data.strategies.map((s: IStrategy) => {
            const ownerCollaborator = s.collaborators?.find(c => c.type === 'owner');
            return !!ownerCollaborator?.is_favourite;
          })
        );
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (session && !fetched.current) {
      fetched.current = true;
      fetchStrategies();
    }
  }, [session]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const debounceFetch = setTimeout(() => {
      fetchStrategies();
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, sortBy, sortOrder, perPage]);

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split(":");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || "desc");
  };

  const toggleStar = async (index: number) => {
    const strategy = strategies[index];
    try {
      const res = await favouriteStrategy(strategy.id, session);
      if (res.status && !res.data.is_favourite) {
        // If unfavorited on the favorites page, refetch to remove it
        fetchStrategies();
      } else if (res.status) {
        const updated = [...starredItems];
        updated[index] = !!res.data.is_favourite;
        setStarredItems(updated);
      }
    } catch (error) {
      console.error("Failed to update favourite status", error);
    }
  };
  
  const handleCopyStrategy = async (id: string) => {
    try {
      await copyStrategy(id, session);
      // You might want to redirect to the new strategy or show a notification
    } catch (error) {
      console.error("Failed to copy strategy", error);
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-semibold mb-6">Favorite Strategies</h1>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader text="Loading favorites..." />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              {/* Header Controls */}
              <div className="flex items-center justify-between mb-6">
                {/* Search */}
                <div className="relative w-full max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-10" />
                  <Input
                    type="text"
                    placeholder="Search favorites"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-4">
                  <Select
                    onValueChange={(value) => setPerPage(parseInt(value, 10))}
                    value={perPage.toString()}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={handleSortChange} value={`${sortBy}:${sortOrder}`}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at:desc">
                        Sort by: Last Modified
                      </SelectItem>
                      <SelectItem value="name:asc">Sort by: Name</SelectItem>
                      <SelectItem value="created_at:desc">Sort by: Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {strategies.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((strategy, index) => (
                  <Card
                    key={strategy.id}
                    className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-[10px]"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between mt-8 px-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {strategy.name}
                        </h3>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="px-5 pt-1 pb-2">
                        {strategy.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs mr-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="aspect-video px-5 mb-4">
                        <Image
                          src={"https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop"}
                          alt={strategy.name}
                          width={400}
                          height={200}
                          className="w-full h-full object-cover rounded-[10px]"
                          unoptimized
                        />
                      </div>

                      <div className="px-5 pb-4">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Last edited {new Date(strategy.updated_at).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              className="h-6 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(index);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                fill={starredItems[index] ? "#00AA67" : "none"}
                                className="h-6 w-5"
                                style={{
                                  stroke: "#00AA67",
                                }}
                              >
                                <path
                                  strokeWidth="1.7"
                                  d="M8.39 4.958C9.553 2.875 10.133 1.833 11 1.833s1.449 1.042 2.61 3.125l.3.539c.33.591.495.887.752 1.083s.578.267 1.219.412l.583.132c2.255.51 3.382.766 3.65 1.628.268.863-.5 1.761-2.037 3.559l-.398.465c-.437.51-.655.766-.753 1.082-.099.316-.066.657 0 1.338l.06.62c.233 2.399.35 3.598-.353 4.13-.702.534-1.758.048-3.869-.924l-.546-.252c-.6-.276-.9-.414-1.218-.414s-.618.138-1.218.414l-.546-.252c-2.11.972-3.166 1.458-3.869.925-.702-.533-.586-1.732-.353-4.13l.06-.62c.066-.682.099-1.023 0-1.34-.098-.315-.316-.57-.753-1.081l-.397-.465c-1.538-1.798-2.306-2.696-2.038-3.559.268-.862 1.396-1.118 3.65-1.628l.584-.132c.64-.145.96-.217 1.218-.412.257-.196.422-.492.752-1.083z"
                                />
                              </svg>
                            </button>

                            <Clipboard
                              className="h-6 w-5"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleCopyStrategy(strategy.id);
                              }}
                            />
                            <Link2 className="h-6 w-5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>

              {/* Page Numbers */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  1
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  2
                </PaginationLink>
              </PaginationItem>

              {/* Dots without border */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ color: "#CBD5E0" }}
                >
                  ...
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#CBD5E0" }}
                >
                  10
                </PaginationLink>
              </PaginationItem>

              {/* Next Button */}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border"
                  style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </main>
      </div>
    </div>
  );
};

export default Favorites;