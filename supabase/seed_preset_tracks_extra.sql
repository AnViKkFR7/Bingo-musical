-- ============================================================
-- seed_preset_tracks_extra.sql
-- Añade dos nuevas playlists preset y sus canciones:
--
--   · All About 80s  — 80s alternativo/synth/new wave/pop
--     (distinto al "All Out 80s" ya existente; incluye cuts
--     que aquel no tiene: Depeche Mode, The Cure, Erasure…)
--
--   · Top 50 España  — hits que lideran las listas en España
--     (mezcla de pop español, reggaetón/urbano latino y pop
--     internacional con fuerte tracción en el mercado español)
--
-- Prerequisitos:
--   1. seed_playlists.sql ejecutado previamente.
--   2. seed_preset_tracks.sql ejecutado previamente
--      (crea la tabla preset_tracks y su política RLS).
--
-- El script es idempotente: ON CONFLICT DO NOTHING en todos los
-- INSERT. Se puede ejecutar varias veces sin problema.
--
-- ⚠ SPOTIFY IDs de estas playlists:
--   Las playlists editoriales de Spotify no son accesibles via
--   API en modo desarrollo (cambio de nov 2024). Se usan los IDs
--   únicamente como clave en nuestra BD; las canciones se sirven
--   directamente desde preset_tracks.
--   Verificar/ajustar el spotify_id si el usuario pega la URL
--   exacta de otra variante:
--   · All About 80s → 37i9dQZF1DXaBxmagGDwHY
--   · Top 50 España → 37i9dQZEVXbJwoKy8qKpHG
-- ============================================================


-- ── 1. Insertar playlists (si ya no existen) ──────────────────

INSERT INTO playlists (spotify_id, name, owner_name, is_preset)
VALUES
  ('37i9dQZF1DXaBxmagGDwHY', 'All About 80s',  'Spotify', true),
  ('37i9dQZEVXbJwoKy8qKpHG', 'Top 50 España',  'Spotify', true)
ON CONFLICT (spotify_id) DO NOTHING;


-- ── 2. All About 80s ─────────────────────────────────────────
-- New wave, synth-pop, electropop, glam y pop de los 80s.
-- No se solapan (intencionalmente) con los 30 temas de
-- la playlist "All Out 80s" ya existente en el sistema.

WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DXaBxmagGDwHY')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Sweet Dreams (Are Made of This)',    'Eurythmics'),
  ( 2, 'Personal Jesus',                     'Depeche Mode'),
  ( 3, 'Just Can''t Get Enough',             'Depeche Mode'),
  ( 4, 'Boys Don''t Cry',                    'The Cure'),
  ( 5, 'A Little Respect',                   'Erasure'),
  ( 6, 'West End Girls',                     'Pet Shop Boys'),
  ( 7, 'Blue Monday',                        'New Order'),
  ( 8, 'Don''t You Want Me',                 'The Human League'),
  ( 9, 'Only You',                           'Yazoo'),
  (10, 'Relax',                              'Frankie Goes to Hollywood'),
  (11, 'Faith',                              'George Michael'),
  (12, 'In the Air Tonight',                 'Phil Collins'),
  (13, 'Thriller',                           'Michael Jackson'),
  (14, 'Like a Prayer',                      'Madonna'),
  (15, 'Jessie''s Girl',                     'Rick Springfield'),
  (16, 'You Give Love a Bad Name',           'Bon Jovi'),
  (17, 'I Love Rock ''n'' Roll',             'Joan Jett'),
  (18, 'Time After Time',                    'Cyndi Lauper'),
  (19, 'Sharp Dressed Man',                  'ZZ Top'),
  (20, 'I Want to Know What Love Is',        'Foreigner'),
  (21, 'Everybody Wants to Rule the World',  'Tears For Fears'),
  (22, 'Karma Chameleon',                    'Culture Club'),
  (23, 'Wake Me Up (Before You Go-Go)',      'Wham!'),
  (24, 'Club Tropicana',                     'Wham!'),
  (25, 'The Sun Always Shines on T.V.',      'a-ha'),
  (26, 'Should I Stay or Should I Go',       'The Clash'),
  (27, 'White Wedding',                      'Billy Idol'),
  (28, 'Dancing in the Dark',                'Bruce Springsteen'),
  (29, 'Running Up That Hill',               'Kate Bush'),
  (30, 'Take My Breath Away',               'Berlin')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ── 3. Top 50 España ─────────────────────────────────────────
-- Mezcla de lo que lidera las listas en España: pop español,
-- urbano latino (reggaetón/trap), e internacional con
-- tracción fuerte en el mercado español.

WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZEVXbJwoKy8qKpHG')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  -- Pop español
  ( 1, 'Corazón Partío',                     'Alejandro Sanz'),
  ( 2, 'Solamente tú',                       'Pablo Alborán'),
  ( 3, 'Bulería',                            'David Bisbal'),
  ( 4, 'Cero',                               'Dani Martín'),
  ( 5, 'Aprendiz',                           'Malú'),
  ( 6, 'Devuélveme La Vida',                 'Antonio Orozco'),
  ( 7, 'Un Alumno Más',                      'Melendi'),
  ( 8, 'Inevitable',                         'Alejandro Sanz'),
  ( 9, 'Quién',                              'Pablo Alborán'),
  -- Urbano español y latino (muy fuertes en España)
  (10, 'BIZCOCHITO',                         'Rosalía'),
  (11, 'Con Altura',                         'Rosalía'),
  (12, 'Bzrp Music Sessions #53',            'Bizarrap'),
  (13, 'Bzrp Music Sessions #52',            'Quevedo'),
  (14, 'Todo De Ti',                         'Rauw Alejandro'),
  (15, 'Provenza',                           'Karol G'),
  (16, 'CAIRO',                              'Quevedo'),
  (17, 'Tití Me Preguntó',                   'Bad Bunny'),
  (18, 'Efecto',                             'Bad Bunny'),
  (19, 'La Jumpa',                           'Arcángel'),
  (20, 'BELLAKEO',                           'Peso Pluma'),
  (21, 'Shakira: Bzrp Music Sessions Vol. 53','Bizarrap'),
  -- Internacional con gran tracción en España
  (22, 'Flowers',                            'Miley Cyrus'),
  (23, 'As It Was',                          'Harry Styles'),
  (24, 'Anti-Hero',                          'Taylor Swift'),
  (25, 'Blinding Lights',                    'The Weeknd'),
  (26, 'Shape of You',                       'Ed Sheeran'),
  (27, 'BIRDS OF A FEATHER',                 'Billie Eilish'),
  (28, 'APT.',                               'ROSÉ'),
  (29, 'Espresso',                           'Sabrina Carpenter'),
  (30, 'Die With A Smile',                   'Lady Gaga')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ── Verificación ─────────────────────────────────────────────
-- SELECT pl.name AS playlist, COUNT(pt.id) AS tracks
-- FROM playlists pl
-- LEFT JOIN preset_tracks pt ON pt.playlist_id = pl.id
-- WHERE pl.spotify_id IN (
--   '37i9dQZF1DXaBxmagGDwHY',
--   '37i9dQZEVXbJwoKy8qKpHG'
-- )
-- GROUP BY pl.name
-- ORDER BY pl.name;
