import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { supabase } from '../lib/supabase'

/**
 * Controla la reproducción de audio del preview de Deezer.
 * SOLO se usa en el dispositivo del DJ (is_host = true).
 * Llama al edge function deezer-get-preview para obtener una URL fresca
 * cada vez que cambia la canción (las URLs de Deezer caducan en ~15 min).
 */
export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)   // 0–100
  const [hasError, setHasError] = useState(false)
  const [isFetchingPreview, setIsFetchingPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getCurrentTrack = useGameStore(s => s.getCurrentTrack)
  const currentTrack = getCurrentTrack()

  // Crear / destruir el elemento <audio> una sola vez
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  // Obtener URL de preview fresca de Deezer cuando cambia la canción
  useEffect(() => {
    if (!currentTrack?.name || !currentTrack?.artist) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    setPreviewUrl(null)
    setIsFetchingPreview(true)
    setHasError(false)

    supabase.functions.invoke('deezer-get-preview', {
      body: { artist: currentTrack.artist, title: currentTrack.name },
    }).then(({ data, error }) => {
      if (cancelled) return
      setIsFetchingPreview(false)
      if (!error && data?.preview_url) {
        setPreviewUrl(data.preview_url)
      } else {
        setPreviewUrl(null)
        if (error) setHasError(true)
      }
    })

    return () => { cancelled = true }
  }, [currentTrack?.id])

  // Cargar y reproducir automáticamente cuando la URL esté lista
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setProgress(0)

    if (!previewUrl) {
      audio.pause()
      audio.src = ''
      setIsPlaying(false)
      return
    }

    audio.src = previewUrl
    audio.load()

    // Autoplay cuando llega una canción nueva
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {
      // El navegador puede bloquear el autoplay sin interacción previa
      setIsPlaying(false)
    })
  }, [previewUrl])

  // Listeners de eventos del audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }
    const onError = () => {
      setHasError(true)
      setIsPlaying(false)
    }
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play().catch(() => {})
    }
  }, [isPlaying])

  return {
    isPlaying,
    progress,
    hasError,
    isFetchingPreview,
    previewUrl,
    play,
    pause,
    togglePlay,
    currentTrack,
  }
}
