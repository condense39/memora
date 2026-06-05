import { Metadata } from "next";
import SearchResults from "@/components/search/SearchResults";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Search | Memora",
  description: "Search events, photos, and tags on Memora",
};

export default function SearchPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  );
}
