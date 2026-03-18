import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '../store/gameStore'

/**
 * Controla la reproducción de audio del preview de Spotify.
 * SOLO se usa en el dispositivo del DJ (is_host = true).
 * Los jugadores nunca instancian este hook para reproducir audio.
 */
export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)   // 0–100
  const [hasError, setHasError] = useState(false)

  const getCurrentTrack = useGameStore(s => s.getCurrentTrack)
  const currentTrack = getCurrentTrack()
  const previewUrl = currentTrack?.preview_url ?? null

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

  // Cambiar fuente cuando cambia la canción
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setHasError(false)
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
    play,
    pause,
    togglePlay,
    currentTrack,
  }
}
