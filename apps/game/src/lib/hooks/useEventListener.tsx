/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect } from 'react'
/**
 * useEventListener
 * Hook for handling EventListeners
 * @return {object} width, height
 */
export function useEventListener(eventName:string, handler:(event: any) => void, element = window) : void {
  // Create a ref that stores handler
  const savedHandler:any = useRef()

  // Update ref.current value if handler changes.
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(
    () => {
      // Make sure element supports addEventListener
      const isSupported = element && element.addEventListener
      if (!isSupported) return

      // Create event listener that calls handler function stored in ref
      const eventListener = (event: any) => savedHandler.current(event)

      // Add event listener
      element.addEventListener(eventName, eventListener)

      // Remove event listener on cleanup
      return () => {
        element.removeEventListener(eventName, eventListener)
      }
    },
    [eventName, element] // Re-run if eventName or element changes
  )
}
