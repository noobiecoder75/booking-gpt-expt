"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useSpring } from "motion/react"

interface ScrollProgressProps {
  className?: string
  position?: "top" | "bottom"
  height?: string
  color?: string
}

export function ScrollProgress({
  className = "",
  position = "top",
  height = "4px",
  color = "#0056D2", // clio-blue
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const isGradient = color.includes("gradient")

  return (
    <motion.div
      className={`fixed ${position === "top" ? "top-0" : "bottom-0"} left-0 right-0 z-50 origin-left ${className}`}
      style={{
        scaleX,
        height,
        ...(isGradient
          ? { background: color }
          : { backgroundColor: color }),
      }}
    />
  )
}
