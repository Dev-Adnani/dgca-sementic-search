'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AirplaneHeroProps {
  title: string
  subtitle: string
  ctaText: string
  onCta: () => void
  children?: React.ReactNode
}

export default function AirplaneHero({
  title,
  subtitle,
  ctaText,
  onCta,
  children,
}: AirplaneHeroProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl font-bold drop-shadow-lg md:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-4 max-w-2xl text-lg md:text-2xl"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-8"
        >
          <button
            onClick={onCta}
            className="rounded-2xl bg-sky-500 px-6 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:bg-sky-600"
          >
            {ctaText}
          </button>
        </motion.div>
        <div className="mt-6 w-full max-w-xl">
          <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
