-- ============================================================
-- SEED: Playlists destacadas (is_preset = true)
-- Ejecutar en Supabase → SQL Editor
--
-- Estas son las playlists que aparecen en "Playlists destacadas"
-- en la pantalla de Crear partida.
-- La imagen se deja null — en la UI aparece un placeholder ♪
-- y el usuario puede actualizar el campo image_url desde el
-- dashboard de Supabase si lo desea.
--
-- Para añadir más: copia el bloque INSERT y cambia el
-- spotify_id y name. El spotify_id se extrae de la URL:
--   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
--   → spotify_id = 37i9dQZF1DXcBWIGoYBM5M
-- ============================================================

-- ── 1. Política RLS (si aún no existe) ───────────────────────
-- Permite que los jugadores anónimos lean las playlists preset.

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'playlists' AND policyname = 'playlists_select_anon'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY playlists_select_anon
        ON playlists FOR SELECT
        TO anon
        USING (true);
    $policy$;
  END IF;
END $$;


-- ── 2. Playlists preset ───────────────────────────────────────

INSERT INTO playlists (spotify_id, name, owner_name, is_preset)
VALUES
  -- Actualidad global
  ('37i9dQZF1DXcBWIGoYBM5M', 'Today''s Top Hits',    'Spotify',  true),
  ('37i9dQZEVXbMDoHDwVN2tF', 'Top 50 — Global',      'Spotify',  true),
  -- Por décadas
  ('37i9dQZF1DX4UtSsGT1Sbe', 'All Out 80s',          'Spotify',  true),
  ('37i9dQZF1DXbTxeAdrVG2l', 'All Out 90s',          'Spotify',  true),
  ('37i9dQZF1DX4o1uurqregion','All Out 2000s',        'Spotify',  true),
  -- Géneros
  ('37i9dQZF1DWXRqgorJj26U', 'Rock Classics',        'Spotify',  true),
  ('37i9dQZF1DX10zKzsJ2jva', 'Viva Latino',          'Spotify',  true),
  ('37i9dQZF1DXaXB8fQg7xof', 'Dance Hits',           'Spotify',  true)
ON CONFLICT (spotify_id) DO NOTHING;
