"use client";

import { motion } from "framer-motion";

export function RouteMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-full motion-page"
    >
      {children}
    </motion.div>
  );
}
