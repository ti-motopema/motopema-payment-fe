"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background" data-testid="state-loading">
      <div className="w-full border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-7 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <CardContent className="p-6 space-y-5">
                <Skeleton className="h-5 w-44" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-16 rounded-md" />
                  <Skeleton className="h-16 rounded-md" />
                  <Skeleton className="h-16 rounded-md" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-11 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
