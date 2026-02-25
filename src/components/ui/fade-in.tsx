"use client";

import { motion } from "framer-motion";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
};

const defaultProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export function FadeIn({ children, className, delay = 0, as = "div" }: FadeInProps) {
  const transition = { duration: 0.3, delay };
  if (as === "section") {
    return (
      <motion.section {...defaultProps} transition={transition} className={className}>
        {children}
      </motion.section>
    );
  }
  return (
    <motion.div {...defaultProps} transition={transition} className={className}>
      {children}
    </motion.div>
  );
}
