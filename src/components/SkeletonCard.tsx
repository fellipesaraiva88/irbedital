import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard = () => (
  <Card className="border-border/50">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-1.5 mt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3 pt-0">
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-1.5 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

export default SkeletonCard;
