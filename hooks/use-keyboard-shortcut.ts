'use client'

import { useEffect, useRef } from 'react'

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export interface KeyboardShortcutOptions {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  enabled?: boolean
  preventDefault?: boolean
  ignoreTypingTargets?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const {
    ctrl = false,
    meta = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
    ignoreTypingTargets = true,
  } = options

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      if (ignoreTypingTargets && isTypingTarget(event.target)) return
      if (ctrl !== event.ctrlKey) return
      if (meta !== event.metaKey) return
      if (shift !== event.shiftKey) return
      if (alt !== event.altKey) return
      if (event.key.toLowerCase() !== key.toLowerCase()) return

      if (preventDefault) event.preventDefault()
      callbackRef.current(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, ctrl, meta, shift, alt, enabled, preventDefault, ignoreTypingTargets])
}
