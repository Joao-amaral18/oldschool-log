import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div className={cn("flex flex-col space-y-3", className)} {...props}>
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    )
  }
  
  function SkeletonList({
    count = 3,
    className,
    ...props
  }: { count?: number } & React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div className={cn("space-y-4", className)} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  function SkeletonTable({
    rows = 4,
    cols = 3,
    className,
    ...props
  }: { rows?: number; cols?: number } & React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div className={cn("space-y-3", className)} {...props}>
          <div className="flex space-x-3">
              {Array.from({ length: cols }).map((_, i) => (
                  <Skeleton key={i} className="h-8 flex-1" />
              ))}
          </div>
          {Array.from({ length: rows -1 }).map((_, i) => (
               <div key={i} className="flex space-x-3">
                  {Array.from({ length: cols }).map((_, j) => (
                      <Skeleton key={j} className="h-8 flex-1" />
                  ))}
              </div>
          ))}
      </div>
    )
  }
  
  function SkeletonForm({
    fields = 3,
    className,
    ...props
  }: { fields?: number } & React.HTMLAttributes<HTMLFormElement>) {
    return (
      <form className={cn("space-y-6", className)} {...props}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-1/3" />
      </form>
    )
  }
  

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonForm }
