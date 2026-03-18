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

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('create.presets')}</h3>
      <div className={styles.grid}>
        {playlists.map(playlist => (
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
    </section>
  )
}
