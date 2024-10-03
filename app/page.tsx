'use client'

import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Points, PointMaterial, Sphere } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

function StarField(props) {
  const ref = useRef()
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }))

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10
    ref.current.rotation.y -= delta / 15
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffa0e0"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function Earth({ isVisible }) {
  const earthRef = useRef()
  const texture = useLoader(THREE.TextureLoader, '/assets/3d/texture_earth.jpg')

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <Sphere ref={earthRef} args={[0.2, 64, 64]} scale={isVisible ? 1 : 0}>
      <meshStandardMaterial map={texture} />
    </Sphere>
  )
}

function RippleEffect() {
  const meshRef = useRef()
  const [ripples, setRipples] = useState([])

  useFrame((state, delta) => {
    setRipples((prevRipples) =>
      prevRipples
        .map((ripple) => ({
          ...ripple,
          radius: ripple.radius + delta * 0.5,
          opacity: ripple.opacity - delta * 0.2,
        }))
        .filter((ripple) => ripple.opacity > 0)
    )

    if (Math.random() < 0.05) {
      setRipples((prevRipples) => [
        ...prevRipples,
        {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          radius: 0,
          opacity: 0.5,
        },
      ])
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        transparent
        uniforms={{
          uTime: { value: 0 },
          uRipples: { value: ripples },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uRipples[20];
          varying vec2 vUv;
          void main() {
            vec3 color = vec3(0.0);
            for (int i = 0; i < 20; i++) {
              vec2 rippleCenter = uRipples[i].xy;
              float rippleRadius = uRipples[i].z;
              float rippleOpacity = uRipples[i].w;
              float d = distance(vUv, rippleCenter);
              if (d < rippleRadius && d > rippleRadius - 0.1) {
                color += vec3(0.1, 0.5, 1.0) * rippleOpacity;
              }
            }
            gl_FragColor = vec4(color, max(max(color.r, color.g), color.b));
          }
        `}
      />
    </mesh>
  )
}

export default function Home() {
  const [showHologram, setShowHologram] = useState(false)

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <StarField />
        <AnimatePresence>
          {showHologram && (
            <motion.group
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Earth isVisible={showHologram} />
              <RippleEffect />
            </motion.group>
          )}
        </AnimatePresence>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <h1 className="mb-4 text-6xl font-extrabold leading-none tracking-tight text-white md:text-8xl lg:text-9xl">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Project X
            </span>
          </h1>
          <p className="mb-8 text-lg font-normal text-gray-300 sm:px-16 lg:text-xl xl:px-48">
            Revolutionizing the future with cutting-edge technology
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHologram(!showHologram)}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {showHologram ? 'Hide Hologram' : 'Explore the Future'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}