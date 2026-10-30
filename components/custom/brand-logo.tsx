import { cn } from "@/lib/utils";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  nameClassName?: string;
};

export function BrandLogo({
  className,
  nameClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo-light.png"
        alt="Clariose"
        width={2072}
        height={512}
        className="h-8 w-auto object-contain dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={2072}
        height={512}
        className="hidden h-8 w-auto object-contain dark:block"
      />
      <span className={cn("sr-only", nameClassName)}>Clariose</span>
    </span>
  );
}
