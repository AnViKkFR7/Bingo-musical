import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpotifyPlaylistResult } from '../../types'
import styles from './PlaylistSearch.module.css'

interface Props {
  selectedId?: string
  onSelect: (spotifyId: string) => void
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function PlaylistSearch({ selectedId, onSelect }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyPlaylistResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => search(value.trim()), 500)
  }

  async function search(q: string) {
    setLoading(true)
    setError(null)
    try {
      const url = `${SUPABASE_URL}/functions/v1/spotify-search?q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      })
      if (!res.ok) throw new Error('search_failed')
      const data: SpotifyPlaylistResult[] = await res.json()
      setResults(data)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('create.search')}</h3>
      <input
        type="search"
        className="input"
        placeholder={t('create.searchPlaceholder')}
        value={query}
        onChange={e => handleChange(e.target.value)}
        autoComplete="off"
      />
      {loading && <p className={styles.status}>{t('common.loading')}</p>}
      {error && <p className={styles.error}>{error}</p>}
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map(pl => (
            <li key={pl.spotify_id}>
              <button
                type="button"
                className={`${styles.resultItem} ${selectedId === pl.spotify_id ? styles.selected : ''}`}
                onClick={() => onSelect(pl.spotify_id)}
              >
                {pl.image_url ? (
                  <img src={pl.image_url} alt={pl.name} className={styles.thumb} loading="lazy" />
                ) : (
                  <div className={styles.thumbPlaceholder}>♪</div>
                )}
                <div className={styles.info}>
                  <span className={styles.name}>{pl.name}</span>
                  <span className={styles.meta}>
                    {pl.owner_name} &middot; {pl.track_count} tracks
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
