import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-9 shrink-0"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="20" fill="var(--primary)" />
        {/* Semilla estilizada */}
        <path
          d="M20 8c-4 0-7 3-7 7 0 4 3 9 7 17 4-8 7-13 7-17 0-4-3-7-7-7z"
          fill="var(--chart-1)"
        />
        <circle cx="20" cy="15" r="2.5" fill="var(--primary-foreground)" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-sm font-semibold">
            Jardín Girasoles
          </span>
          <span className="text-muted-foreground text-xs">Aula</span>
        </div>
      )}
    </div>
  );
}
