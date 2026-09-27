import { RouteMotion } from "@/components/motion/route-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteMotion>{children}</RouteMotion>;
}
