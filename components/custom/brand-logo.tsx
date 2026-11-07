import { cn } from "@/lib/utils";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  nameClassName?: string;
  mobileIconOnly?: boolean;
};

export function BrandLogo({
  className,
  nameClassName,
  mobileIconOnly = false,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/favicon.png"
        alt="Clariose"
        width={512}
        height={512}
        className={cn(
          "h-8 w-8 shrink-0 object-contain",
          mobileIconOnly
            ? "my-1 md:hidden"
            : "hidden group-data-[collapsible=icon]:!my-1 group-data-[collapsible=icon]:!block",
        )}
      />
      <Image
        src="/logo-light.png"
        alt=""
        aria-hidden="true"
        width={2072}
        height={512}
        className={cn(
          "h-8 w-auto object-contain dark:hidden group-data-[collapsible=icon]:!hidden",
          mobileIconOnly && "hidden md:block",
        )}
      />
      <Image
        src="/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={2072}
        height={512}
        className={cn(
          "hidden h-8 w-auto object-contain dark:block group-data-[collapsible=icon]:!hidden",
          mobileIconOnly && "dark:hidden md:dark:block",
        )}
      />
      <span className={cn("sr-only", nameClassName)}>Clariose</span>
    </span>
  );
}
