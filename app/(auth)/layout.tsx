"use client"

import { motion } from "framer-motion"
import { BrandMark, BrandWordmark } from "@/components/layout/brand-mark"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden px-4 py-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary-subtle)_0%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02))]"
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8 flex items-center gap-3"
      >
        <BrandMark className="size-10" />
        <BrandWordmark className="text-xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {children}
      </motion.div>

      <p className="relative mt-8 text-center text-muted-fg text-xs">
        Premium agency operations, built for modern teams.
      </p>
    </div>
  )
}
