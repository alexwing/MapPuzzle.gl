import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useEventListener } from './hooks/useEventListener'
import IsDevice from './helpers/isDevice'
import { setColor } from './Utils.js';
/**
 * Cursor Core
 * Replaces the native cursor with a custom animated cursor, consisting
 * of an inner and outer dot that scale inversely based on hover or click.
 *
 * @author Alejandro Aranda (github.com/alexwing)
 * @author Folk from Stephen Scaff (github.com/stephenscaff)
 *
 * @param {string} color - rgb color value
 * @param {number} clickScale - inner cursor scale amount
 *
 */
function CursorCore({
  color = '220, 90, 90',
  clickScale = 0.7,
  selected = null,
  tooltip = "",
}) {
  const pieceCursorRef = useRef()
  const tooltipRef = useRef()
  const requestRef = useRef()
  const previousTimeRef = useRef()
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isActiveClickable, setIsActiveClickable] = useState(false)
  let endX = useRef(0)
  let endY = useRef(0)

  // Primary Mouse Move event
  const onMouseMove = useCallback(({ clientX, clientY }) => {
    setCoords({ x: clientX, y: clientY })
    tooltipRef.current.style.top = clientY + 'px'
    tooltipRef.current.style.left = clientX + 'px'
    endX.current = clientX
    endY.current = clientY
  }, [])

  // Outer Cursor Animation Delay
  const animateOuterCursor = useCallback(
    (time) => {
      if (previousTimeRef)
        if (previousTimeRef.current !== undefined && pieceCursorRef && coords) {
          coords.x += (endX.current - coords.x) / 8
          coords.y += (endY.current - coords.y) / 8
          if (pieceCursorRef.current) {
            pieceCursorRef.current.style.top = coords.y + 'px'
            pieceCursorRef.current.style.left = coords.x + 'px'
          }
        }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animateOuterCursor)
    },
    [requestRef] // eslint-disable-line
  )

  // RAF for animateOuterCursor
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateOuterCursor)
    return () => {
      cancelAnimationFrame(requestRef.current)
    }
  }, [animateOuterCursor])

  // Mouse Events State updates
  const onMouseDown = useCallback(() => {
    setIsActive(true)
  }, [])

  const onMouseUp = useCallback(() => {
    setIsActive(false)
  }, [])

  const onMouseEnterViewport = useCallback(() => {
    setIsVisible(true)
  }, [])

  const onMouseLeaveViewport = useCallback(() => {
    setIsVisible(false)
  }, [])

  useEventListener('mousemove', onMouseMove)
  useEventListener('mousedown', onMouseDown)
  useEventListener('mouseup', onMouseUp)
  useEventListener('mouseover', onMouseEnterViewport)
  useEventListener('mouseout', onMouseLeaveViewport)

  // Cursors Hover/Active State
  useEffect(() => {
    if (isActive) {
      tooltipRef.current.style.transform = `translateZ(0) scale(${clickScale})`
      pieceCursorRef.current.style.transform = `translateZ(0) scale(${clickScale})`
    } else {
      tooltipRef.current.style.transform = 'translateZ(0) scale(1)'
      pieceCursorRef.current.style.transform = 'translateZ(0) scale(1)'
    }
  }, [ clickScale, isActive])

  // Cursors Click States
  useEffect(() => {
    tooltipRef.current.style.transform = `translateZ(0) scale(${clickScale})`
    if (isActiveClickable) {
      pieceCursorRef.current.style.transform = `translateZ(0) scale(${clickScale})`
    }
  }, [ clickScale, isActiveClickable])


  // Cursor Visibility State
  useEffect(() => {
    if (isVisible) {
      tooltipRef.current.style.opacity = 1
      pieceCursorRef.current.style.opacity = 1
    } else {
      tooltipRef.current.style.opacity = 1
      pieceCursorRef.current.style.opacity = 0
    }
  }, [isVisible])

  // Target all possible clickables
  useEffect(() => {
    const clickables = document.querySelectorAll(
      'a, input[type="submit"], input[type="image"], label[for], select, button, .link'
    )
    clickables.forEach((el) => {
      el.style.cursor = 'none'


      el.addEventListener('mouseover', () => {
        setIsActive(true)
      })
      el.addEventListener('click', () => {
        setIsActive(true)
        setIsActiveClickable(false)
      })
      el.addEventListener('mousedown', () => {
        setIsActiveClickable(true)
      })
      el.addEventListener('mouseup', () => {
        setIsActive(true)
      })
      el.addEventListener('mouseout', () => {
        setIsActive(false)
        setIsActiveClickable(false)
      })
    })

    return () => {
      clickables.forEach((el) => {
        el.removeEventListener('mouseover', () => {
          setIsActive(true)
        })
        el.removeEventListener('click', () => {
          setIsActive(true)
          setIsActiveClickable(false)
        })
        el.removeEventListener('mousedown', () => {
          setIsActiveClickable(true)
        })
        el.removeEventListener('mouseup', () => {
          setIsActive(true)
        })
        el.removeEventListener('mouseout', () => {
          setIsActive(false)
          setIsActiveClickable(false)
        })
      })
    }
  }, [isActive])

  // Cursor Styles
  const styles = {
    pieceStyle: {
      zIndex: 1,
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      backfaceVisibility: 'hidden',
      willChange: 'transform',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
    },
    tooltipStyle: {
      //  pointerEvents: 'none',
      zIndex: 999,
      display: 'block',
      position: 'fixed',
      borderRadius: '15px',
      padding: '0px 10px',
      fontSize: '11px',
      fontWeight: 'bold',
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: 'white',
      backfaceVisibility: 'hidden',
      willChange: 'transform',
      transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
    }
  }
  // Hide / Show global cursor
  //document.body.style.cursor = 'none'


  let PieceCursor;
  if (selected) {
    PieceCursor =
      <svg height="180px" width="180px"
        viewBox={selected ? (selected.properties.box) : ''} preserveAspectRatio="slice" style={{ border: "0px solid lightgray", marginLeft: "-50%", marginTop: "-50%" }}>
        <path d={selected ? selected.properties.poly : ''} stroke="black" strokeWidth="0" fill={setColor(selected.properties.mapcolor)} />
      </svg>;

  }

  let TooltipCursor;
   if (tooltip) {
      TooltipCursor = <span>{tooltip}</span>;

  }


  return (
    <React.Fragment>
      <div ref={pieceCursorRef} style={styles.pieceStyle} className="mousePiece" >
        {PieceCursor}
      </div>
      <div ref={tooltipRef} style={styles.tooltipStyle} >
        {TooltipCursor}
      </div>
    </React.Fragment>
  )
}

/**
 * AnimatedCursor
 * Calls and passes props to CursorCore if not a touch/mobile device.
 */
function AnimatedCursor({
  color = '220, 90, 90',
  clickScale = 0.7,
  selected = null,
  tooltip = "",

}) {
  if (typeof navigator !== 'undefined' && IsDevice.any()) {
    return <React.Fragment></React.Fragment>
  }
  return (
    <CursorCore
      color={color}
      clickScale={clickScale}
      selected={selected}
      tooltip={tooltip}
    />
  )
}

export default AnimatedCursor
