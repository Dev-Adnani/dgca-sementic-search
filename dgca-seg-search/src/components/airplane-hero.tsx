'use client'

import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Trail } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

interface AirplaneHeroProps {
  title: string
  subtitle: string
  ctaText: string
  onCta: () => void
  children?: React.ReactNode
}

function ThreePlane() {
  const planeRef = useRef<THREE.Mesh>(null)
  const emitterRef = useRef<THREE.Mesh>(null)
  const t = useRef(0)

  useFrame((state: any, delta: number) => {
    if (!planeRef.current || !emitterRef.current) return
    t.current += delta * 0.1

    // Simple circular path
    const radius = 8
    const x = Math.cos(t.current) * radius
    const z = Math.sin(t.current) * radius
    const y = Math.sin(t.current * 2) * 0.5

    planeRef.current.position.set(x, y, z)
    emitterRef.current.position.set(x, y, z)

    // Make plane look forward along path
    const nextX = Math.cos(t.current + 0.01) * radius
    const nextZ = Math.sin(t.current + 0.01) * radius
    planeRef.current.lookAt(nextX, y, nextZ)

    // Bank (tilt) during turns
    planeRef.current.rotation.z = -Math.sin(t.current) * 0.3
  })

  return (
    <>
      {/* Trail needs its own mesh emitter */}
      <Trail
        width={0.15}
        length={6}
        color={'#88ccff'}
        attenuation={(t: number) => t}
      >
        <mesh ref={emitterRef}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </Trail>

      {/* Airplane */}
      <mesh ref={planeRef}>
        <coneGeometry args={[0.3, 1.2, 8]} />
        <meshStandardMaterial
          color="white"
          emissive="skyblue"
          emissiveIntensity={0.5}
        />
      </mesh>
    </>
  )
}

export default function AirplaneHero({
  title,
  subtitle,
  ctaText,
  onCta,
  children,
}: AirplaneHeroProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-slate-900 to-black">
      <Canvas camera={{ position: [0, 4, 14], fov: 55 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <Stars radius={80} depth={50} count={6000} factor={4} fade />
          <ThreePlane />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
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
