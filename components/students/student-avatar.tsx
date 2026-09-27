import { cn } from "@/lib/utils";
import { initials } from "@/components/students/types";

export function StudentAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F6BFF] font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-11 w-11 text-sm",
        size === "lg" && "h-16 w-16 text-lg",
      )}
    >
      {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}
