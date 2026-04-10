import { cn } from "@/lib/utils";
import { RiLoaderLine } from "@remixicon/react";

function Spinner({
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <RiLoaderLine
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
