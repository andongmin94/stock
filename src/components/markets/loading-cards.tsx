import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingCards({
  compact,
  count,
}: {
  compact: boolean;
  count: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2",
        compact ? "xl:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card
          className={cn(
            "neo-panel gap-0 rounded-[18px] py-0",
            compact && "asset-card-compact",
          )}
          key={index}
        >
          <CardHeader className={cn("gap-2 px-4 pt-4 pb-3", compact && "pb-2")}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="size-7 rounded-[12px]" />
                {!compact ? (
                  <Skeleton className="h-6 w-10 rounded-full" />
                ) : null}
              </div>
              {!compact ? <Skeleton className="mt-2 h-3 w-32" /> : null}
            </div>
            <CardAction>
              <Skeleton className="size-7 rounded-[12px]" />
            </CardAction>
          </CardHeader>
          <CardContent
            className={cn("space-y-3 px-4 pb-4", compact && "space-y-2 pb-3")}
          >
            <div className={cn("min-w-0 px-1 py-3", compact && "py-1")}>
              <Skeleton
                className={cn("h-9 w-44 rounded-[12px]", compact && "h-8 w-36")}
              />
              <div
                className={cn(
                  "flex items-center gap-2",
                  compact ? "mt-2" : "mt-3",
                )}
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              {!compact ? <Skeleton className="mt-2 h-3 w-44" /> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
