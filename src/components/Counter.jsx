import React, { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

export default function Counter({ value, decimals = 2, prefix = '', suffix = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(latest) {
        node.textContent = `${prefix}${latest.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}${suffix}`
      }
    })

    return () => controls.stop()
  }, [value, decimals, prefix, suffix])

  return <span ref={ref}>0.00</span>
}
