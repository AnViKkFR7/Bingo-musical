import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import type { Playlist } from '../../types'
import styles from './PresetPlaylistGrid.module.css'

interface Props {
  selectedId?: string
  onSelect: (spotifyId: string) => void
}

export function PresetPlaylistGrid({ selectedId, onSelect }: Props) {
  const { t } = useTranslation()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  // 0 on mobile (< 480px) = hidden initially; 4 on desktop/tablet = 1 row
  const [perRow] = useState(() => window.innerWidth < 480 ? 0 : 4)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_preset', true)
        .order('created_at', { ascending: true })

      if (error) {
        setError(t('errors.generic'))
      } else {
        setPlaylists(data ?? [])
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <p className={styles.status}>{t('common.loading')}</p>
  if (error) return <p className={styles.error}>{error}</p>
  if (!playlists.length) return null

  const visible = expanded ? playlists : playlists.slice(0, perRow)
  const hasMore = playlists.length > perRow

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>{t('create.presets')}</h3>
        {hasMore && (
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? `↑ ${t('create.showLess')}` : `↓ ${t('create.showMore')}`}
          </button>
        )}
      </div>
      {visible.length > 0 && (
        <div className={styles.grid}>
          {visible.map(playlist => (
            <button
              key={playlist.id}
              type="button"
              className={`${styles.card} ${selectedId === playlist.spotify_id ? styles.selected : ''}`}
              onClick={() => onSelect(playlist.spotify_id)}
            >
              {playlist.image_url ? (
                <img
                  src={playlist.image_url}
                  alt={playlist.name}
                  className={styles.image}
                  loading="lazy"
                />
              ) : (
                <div className={styles.imagePlaceholder}>♪</div>
              )}
              <div className={styles.info}>
                <span className={styles.name}>{playlist.name}</span>
                {playlist.owner_name && (
                  <span className={styles.owner}>{playlist.owner_name}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
