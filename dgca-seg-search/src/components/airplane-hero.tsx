'use client'

import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Plane } from 'lucide-react'

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
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 200])

  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-sky-900">
      {/* Dynamic Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-1000" />

      {/* Animated Clouds */}
      <div className="absolute inset-0 overflow-hidden opacity-80 pointer-events-none">
        <motion.div
          animate={{ x: [-100, 1000] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[-20%] h-24 w-64 rounded-full bg-white/40 blur-xl"
        />
        <motion.div
          animate={{ x: [-200, 1200] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute top-[30%] left-[-20%] h-32 w-80 rounded-full bg-white/30 blur-2xl"
        />
        <motion.div
          animate={{ x: [-150, 1100] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear", delay: 10 }}
          className="absolute top-[15%] left-[-20%] h-16 w-48 rounded-full bg-white/50 blur-lg"
        />
      </div>

      {/* Runway / Ground */}
      <div className="absolute bottom-[-10%] left-0 right-0 h-[50vh] bg-slate-800 origin-bottom transform-gpu perspective-[1000px]">
        {/* Runway Lights */}
        <div className="absolute inset-0 flex justify-center perspective-[500px]">
          <div className="relative w-[300px] h-full bg-slate-700/50 transform-style-3d rotate-x-[60deg]">
            {/* Center Line Animating */}
            <motion.div
              animate={{ y: [0, 200] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-0 h-[800px] w-4 -translate-x-1/2 border-l-4 border-dashed border-white/80"
            />

            {/* Side Lights */}
            <div className="absolute left-0 top-0 h-full w-full flex justify-between px-4">
              <div className="h-full w-2 bg-gradient-to-b from-amber-500/0 via-amber-400 to-amber-500/0 animate-pulse" />
              <div className="h-full w-2 bg-gradient-to-b from-amber-500/0 via-amber-400 to-amber-500/0 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Landing Airplane - Clean Diagonal */}
      <motion.div
        initial={{ x: 400, y: -400, scale: 0.5, rotate: -30 }}
        animate={{ x: 0, y: 600, scale: 1.5, rotate: -40 }}
        transition={{ duration: 3.5, ease: "easeOut", delay: 0.5 }}
        className="absolute left-1/2 -ml-12 top-0 z-0 pointer-events-none hidden lg:block text-7xl drop-shadow-xl"
      >
        ✈️
      </motion.div>

      {/* Content Overlay */}
      <div className="relative z-20 flex h-full min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 2 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mb-6 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md"
        >
          <Plane className="mr-2 h-3.5 w-3.5" />
          <span>Final Approach: Semantic Search</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl drop-shadow-lg"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl font-medium drop-shadow-md"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-10"
        >
          <button
            type="button"
            onClick={onCta}
            className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-sky-600 shadow-xl transition-all hover:bg-sky-50 hover:scale-105 active:scale-95"
          >
            <span>{ctaText}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

        {children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="mt-16 w-full max-w-4xl"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  )
}
