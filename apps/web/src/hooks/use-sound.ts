"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Cache storage for loaded audio buffers.
 */
const audioCache = new Map<
  string,
  {
    buffer: AudioBuffer
    loading: Promise<AudioBuffer>
  } | null
>()

/**
 * Shared AudioContext instance.
 */
let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextClass) {
    console.warn("Web Audio API is not supported in this browser.")
    return null
  }

  sharedAudioContext = new AudioContextClass()
  return sharedAudioContext
}

export function useSound(url: string) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const audioCtx = getAudioContext()
    if (!audioCtx) return

    audioCtxRef.current = audioCtx

    const cached = audioCache.get(url)
    if (cached?.buffer) {
      bufferRef.current = cached.buffer
      return
    }

    if (cached?.loading) {
      cached.loading
        .then((decoded) => {
          bufferRef.current = decoded
        })
        .catch(() => {})
      return
    }

    const loadingPromise = fetch(url, { signal: abortController.signal })
      .then((res) => res.arrayBuffer())
      .then((data) => audioCtx.decodeAudioData(data))
      .then((decoded) => {
        audioCache.set(url, { buffer: decoded, loading: loadingPromise as Promise<AudioBuffer> })
        bufferRef.current = decoded
        return decoded
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        audioCache.set(url, null)
        throw err
      })

    audioCache.set(url, { buffer: null!, loading: loadingPromise as Promise<AudioBuffer> })

    return () => {
      abortController.abort()
    }
  }, [url])

  const play = useCallback((volume: number = 1) => {
    if (audioCtxRef.current && bufferRef.current) {
      const source = audioCtxRef.current.createBufferSource()
      const gainNode = audioCtxRef.current.createGain()

      source.buffer = bufferRef.current
      gainNode.gain.value = volume

      source.connect(gainNode)
      gainNode.connect(audioCtxRef.current.destination)
      source.start(0)
    }
  }, [])

  return play
}

export function useSoundLazy(url: string) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const loadingPromiseRef = useRef<Promise<unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(() => {
    const cached = audioCache.get(url)
    return !!cached?.buffer
  })
  const mountedRef = useRef(true)

  useEffect(() => {
    const abortController = new AbortController()
    mountedRef.current = true

    const audioCtx = getAudioContext()
    if (audioCtx) {
      audioCtxRef.current = audioCtx
    }

    const cached = audioCache.get(url)
    if (cached?.buffer) {
      bufferRef.current = cached.buffer
    }

    return () => {
      mountedRef.current = false
      abortController.abort()
    }
  }, [url])

  const load = useCallback(() => {
    if (bufferRef.current) {
      return Promise.resolve(bufferRef.current)
    }

    if (loadingPromiseRef.current) {
      return loadingPromiseRef.current as Promise<AudioBuffer>
    }

    const audioCtx = getAudioContext()
    if (!audioCtx) {
      return Promise.reject(new Error("Web Audio API not supported"))
    }

    audioCtxRef.current = audioCtx

    const cached = audioCache.get(url)
    if (cached?.buffer) {
      bufferRef.current = cached.buffer
      if (mountedRef.current) setIsLoaded(true)
      return Promise.resolve(cached.buffer)
    }

    if (cached?.loading) {
      if (mountedRef.current) setIsLoading(true)
      loadingPromiseRef.current = cached.loading
        .then((decoded) => {
          bufferRef.current = decoded
          if (mountedRef.current) setIsLoaded(true)
          loadingPromiseRef.current = null
          return decoded
        })
        .catch((err) => {
          if (mountedRef.current) setIsLoading(false)
          loadingPromiseRef.current = null
          throw err
        })
      return loadingPromiseRef.current as Promise<AudioBuffer>
    }

    if (mountedRef.current) setIsLoading(true)
    const loadingPromise = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => audioCtx.decodeAudioData(data))
      .then((decoded) => {
        audioCache.set(url, { buffer: decoded, loading: loadingPromise as Promise<AudioBuffer> })
        bufferRef.current = decoded
        if (mountedRef.current) setIsLoaded(true)
        loadingPromiseRef.current = null
        return decoded
      })
      .catch((err) => {
        audioCache.set(url, null)
        if (mountedRef.current) setIsLoading(false)
        loadingPromiseRef.current = null
        throw err
      })

    audioCache.set(url, { buffer: null!, loading: loadingPromise as Promise<AudioBuffer> })
    loadingPromiseRef.current = loadingPromise
    return loadingPromise as Promise<AudioBuffer>
  }, [url])

  const preload = useCallback(() => {
    load().catch(() => {})
  }, [load])

  const play = useCallback(
    (volume: number = 1) => {
      const playSound = () => {
        if (audioCtxRef.current && bufferRef.current) {
          const source = audioCtxRef.current.createBufferSource()
          const gainNode = audioCtxRef.current.createGain()

          source.buffer = bufferRef.current
          gainNode.gain.value = volume

          source.connect(gainNode)
          gainNode.connect(audioCtxRef.current.destination)
          source.start(0)
        }
      }

      if (bufferRef.current) {
        playSound()
        return
      }

      load()
        .then(() => {
          playSound()
        })
        .catch(() => {})
    },
    [load]
  )

  return { play, preload, isLoading, isLoaded }
}
