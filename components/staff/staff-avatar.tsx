import { cn } from "@/lib/utils";
import { initials } from "@/components/students/types";

export function StaffAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "lg" | "md" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F6BFF] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-11 w-11 text-sm",
        size === "lg" && "h-24 w-24 text-2xl",
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant-scoped private API route
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
