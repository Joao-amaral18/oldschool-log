import { useState, useEffect } from 'react'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let timeoutId: number

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY ? 'down' : 'up'

      // Only update if scroll distance is significant (more than 10px)
      if (Math.abs(scrollY - lastScrollY) > 10) {
        setScrollDirection(direction)

        // Hide navbar when scrolling down, show when scrolling up
        if (direction === 'down' && scrollY > 100) {
          setIsVisible(false)
        } else if (direction === 'up') {
          setIsVisible(true)
        }

        lastScrollY = scrollY > 0 ? scrollY : 0
      }

      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Show navbar after 1.5s of no scrolling
      timeoutId = window.setTimeout(() => {
        setIsVisible(true)
      }, 1500)
    }

    const throttledUpdateScrollDirection = () => {
      window.requestAnimationFrame(updateScrollDirection)
    }

    window.addEventListener('scroll', throttledUpdateScrollDirection, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledUpdateScrollDirection)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return { scrollDirection, isVisible }
}
