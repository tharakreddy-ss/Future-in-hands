import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing min-h-screen">
      <MarketingNavbar />
      {children}
      <MarketingFooter />
    </div>
  );
}
