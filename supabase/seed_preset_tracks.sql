-- ============================================================
-- seed_preset_tracks.sql
-- Canciones de las playlists preset, almacenadas directamente
-- en Supabase sin depender de la API de Spotify.
--
-- CONTEXTO: Desde noviembre 2024, la API de Spotify en modo
-- "development" no puede acceder a playlists editoriales cuyo
-- propietario es Spotify (Today's Top Hits, Rock Classics,
-- All Out 80s/90s/2000s, Viva Latino, Dance Hits…).
-- Ref: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
--
-- SOLUCIÓN: Las canciones se almacenan aquí. Al iniciar una
-- partida con playlist preset se leen directamente desde esta
-- tabla, sin ninguna llamada a Spotify.
--
-- album_image_url: NULL en este seed. El cartón muestra ♪ como
-- placeholder. Se puede rellenar manualmente desde el dashboard
-- de Supabase o con una migración posterior.
--
-- ⚠ Today's Top Hits y Top 50 Global contienen canciones de
--   2024–2026. No se actualizan automáticamente; editar esta
--   tabla periódicamente si se quiere mantenerlas al día.
--
-- Instrucciones:
--   1. Ejecutar seed_playlists.sql primero (crea los registros
--      en la tabla `playlists`).
--   2. Ejecutar este archivo en Supabase → SQL Editor.
--   El script es idempotente: ON CONFLICT DO NOTHING.
-- ============================================================


-- ── 1. Tabla ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS preset_tracks (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id     UUID    NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL,
  artist          TEXT    NOT NULL,
  album_image_url TEXT,            -- NULL → placeholder ♪ en el cartón
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (playlist_id, name, artist)
);


-- ── 2. RLS ───────────────────────────────────────────────────

ALTER TABLE preset_tracks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE  tablename  = 'preset_tracks'
      AND  policyname = 'preset_tracks_select_anon'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY preset_tracks_select_anon
        ON preset_tracks FOR SELECT
        TO anon
        USING (true);
    $policy$;
  END IF;
END $$;


-- ── 3. Canciones ─────────────────────────────────────────────
-- Patrón: CTE para obtener el UUID de la playlist, luego
-- CROSS JOIN con la lista de tracks. Idempotente.


-- ─────────────────────── Today's Top Hits ────────────────────
-- Éxitos globales del período 2024–2026 (actualizar periódicamente)
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DXcBWIGoYBM5M')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Espresso',                             'Sabrina Carpenter'),
  ( 2, 'Please Please Please',                  'Sabrina Carpenter'),
  ( 3, 'Good Luck, Babe!',                      'Chappell Roan'),
  ( 4, 'BIRDS OF A FEATHER',                    'Billie Eilish'),
  ( 5, 'Not Like Us',                           'Kendrick Lamar'),
  ( 6, 'A Bar Song (Tipsy)',                    'Shaboozey'),
  ( 7, 'Beautiful Things',                      'Benson Boone'),
  ( 8, 'Too Sweet',                             'Hozier'),
  ( 9, 'Lose Control',                          'Teddy Swims'),
  (10, 'Stick Season',                          'Noah Kahan'),
  (11, 'Texas Hold ''Em',                       'Beyoncé'),
  (12, 'Training Season',                       'Dua Lipa'),
  (13, 'Million Dollar Baby',                   'Tommy Richman'),
  (14, 'I Had Some Help',                       'Post Malone'),
  (15, 'we can''t be friends',                  'Ariana Grande'),
  (16, 'Die With A Smile',                      'Lady Gaga'),
  (17, 'APT.',                                  'ROSÉ'),
  (18, 'luther',                                'Kendrick Lamar'),
  (19, 'Pink Pony Club',                        'Chappell Roan'),
  (20, 'Timeless',                              'The Weeknd'),
  (21, 'Lovin On Me',                           'Jack Harlow'),
  (22, 'Flowers',                               'Miley Cyrus'),
  (23, 'Anti-Hero',                             'Taylor Swift'),
  (24, 'Cruel Summer',                          'Taylor Swift'),
  (25, 'Starboy',                               'The Weeknd'),
  (26, 'Blinding Lights',                       'The Weeknd'),
  (27, 'As It Was',                             'Harry Styles'),
  (28, 'Levitating',                            'Dua Lipa'),
  (29, 'Shape of You',                          'Ed Sheeran'),
  (30, 'Dance The Night',                       'Dua Lipa')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ──────────────────────── Top 50 Global ──────────────────────
-- Mezcla de hits recientes y canciones con tracción global
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZEVXbMDoHDwVN2tF')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Blinding Lights',                       'The Weeknd'),
  ( 2, 'Shape of You',                          'Ed Sheeran'),
  ( 3, 'Sunflower',                             'Post Malone'),
  ( 4, 'God''s Plan',                           'Drake'),
  ( 5, 'Peaches',                               'Justin Bieber'),
  ( 6, 'drivers license',                       'Olivia Rodrigo'),
  ( 7, 'Don''t Start Now',                      'Dua Lipa'),
  ( 8, 'Kiss Me More',                          'Doja Cat'),
  ( 9, 'Heat Waves',                            'Glass Animals'),
  (10, 'As It Was',                             'Harry Styles'),
  (11, 'Stay',                                  'The Kid LAROI'),
  (12, 'Levitating',                            'Dua Lipa'),
  (13, 'Save Your Tears',                       'The Weeknd'),
  (14, 'Uptown Funk',                           'Mark Ronson'),
  (15, 'Bad Guy',                               'Billie Eilish'),
  (16, 'Señorita',                              'Shawn Mendes'),
  (17, 'Someone You Loved',                     'Lewis Capaldi'),
  (18, 'Watermelon Sugar',                      'Harry Styles'),
  (19, 'Industry Baby',                         'Lil Nas X'),
  (20, 'Permission to Dance',                   'BTS'),
  (21, 'Sweet but Psycho',                      'Ava Max'),
  (22, 'Without Me',                            'Halsey'),
  (23, 'Circles',                               'Post Malone'),
  (24, 'Beautiful People',                      'Ed Sheeran'),
  (25, 'Happier',                               'Marshmello'),
  (26, 'Montero (Call Me By Your Name)',         'Lil Nas X'),
  (27, 'good 4 u',                              'Olivia Rodrigo'),
  (28, 'Despacito',                             'Luis Fonsi'),
  (29, 'Believer',                              'Imagine Dragons'),
  (30, 'Thunder',                               'Imagine Dragons')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── All Out 80s ─────────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DX4UtSsGT1Sbe')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Billie Jean',                           'Michael Jackson'),
  ( 2, 'Beat It',                               'Michael Jackson'),
  ( 3, 'Like a Virgin',                         'Madonna'),
  ( 4, 'Material Girl',                         'Madonna'),
  ( 5, 'Take On Me',                            'a-ha'),
  ( 6, 'Girls Just Want to Have Fun',           'Cyndi Lauper'),
  ( 7, 'I Wanna Dance with Somebody',           'Whitney Houston'),
  ( 8, 'Careless Whisper',                      'George Michael'),
  ( 9, 'Africa',                                'Toto'),
  (10, 'Livin'' on a Prayer',                   'Bon Jovi'),
  (11, 'Don''t Stop Me Now',                    'Queen'),
  (12, 'Never Gonna Give You Up',               'Rick Astley'),
  (13, 'Wake Me Up Before You Go-Go',           'Wham!'),
  (14, 'Hungry Like the Wolf',                  'Duran Duran'),
  (15, 'Tainted Love',                          'Soft Cell'),
  (16, 'Every Breath You Take',                 'The Police'),
  (17, 'Sweet Child O'' Mine',                  'Guns N'' Roses'),
  (18, 'Born in the U.S.A.',                    'Bruce Springsteen'),
  (19, 'Let''s Dance',                          'David Bowie'),
  (20, 'Jump',                                  'Van Halen'),
  (21, 'Eye of the Tiger',                      'Survivor'),
  (22, 'Walking on Sunshine',                   'Katrina And The Waves'),
  (23, 'Come On Eileen',                        'Dexys Midnight Runners'),
  (24, 'When Doves Cry',                        'Prince'),
  (25, 'Purple Rain',                           'Prince'),
  (26, 'Footloose',                             'Kenny Loggins'),
  (27, 'Summer of ''69',                        'Bryan Adams'),
  (28, 'Total Eclipse of the Heart',            'Bonnie Tyler'),
  (29, 'Don''t You (Forget About Me)',          'Simple Minds'),
  (30, 'Here I Go Again',                       'Whitesnake')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── All Out 90s ─────────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DXbTxeAdrVG2l')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Smells Like Teen Spirit',               'Nirvana'),
  ( 2, 'Wannabe',                               'Spice Girls'),
  ( 3, 'Waterfalls',                            'TLC'),
  ( 4, 'Ironic',                                'Alanis Morissette'),
  ( 5, 'Wonderwall',                            'Oasis'),
  ( 6, 'I Want It That Way',                    'Backstreet Boys'),
  ( 7, 'Don''t Speak',                          'No Doubt'),
  ( 8, 'Under the Bridge',                      'Red Hot Chili Peppers'),
  ( 9, 'I Will Always Love You',                'Whitney Houston'),
  (10, 'Always Be My Baby',                     'Mariah Carey'),
  (11, 'Say My Name',                           'Destiny''s Child'),
  (12, 'The Sign',                              'Ace of Base'),
  (13, 'Gangsta''s Paradise',                   'Coolio'),
  (14, 'Bullet with Butterfly Wings',           'Smashing Pumpkins'),
  (15, 'Creep',                                 'Radiohead'),
  (16, 'Livin'' la Vida Loca',                  'Ricky Martin'),
  (17, '...Baby One More Time',                 'Britney Spears'),
  (18, 'No Scrubs',                             'TLC'),
  (19, 'Torn',                                  'Natalie Imbruglia'),
  (20, 'My Heart Will Go On',                   'Céline Dion'),
  (21, 'MMMBop',                                'Hanson'),
  (22, 'Losing My Religion',                    'R.E.M.'),
  (23, 'Black Hole Sun',                        'Soundgarden'),
  (24, 'Killing Me Softly',                     'Fugees'),
  (25, 'Everybody (Backstreet''s Back)',         'Backstreet Boys'),
  (26, 'What''s Up',                            '4 Non Blondes'),
  (27, 'Closing Time',                          'Semisonic'),
  (28, 'Fly Away',                              'Lenny Kravitz'),
  (29, 'Bitter Sweet Symphony',                 'The Verve'),
  (30, 'Mambo No. 5',                           'Lou Bega')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── All Out 2000s ───────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DX4o1uurqregion')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Lose Yourself',                         'Eminem'),
  ( 2, 'Crazy in Love',                         'Beyoncé'),
  ( 3, 'Hey Ya!',                               'OutKast'),
  ( 4, 'Since U Been Gone',                     'Kelly Clarkson'),
  ( 5, 'Fallin''',                              'Alicia Keys'),
  ( 6, 'I Gotta Feeling',                       'Black Eyed Peas'),
  ( 7, 'Gold Digger',                           'Kanye West'),
  ( 8, 'Rehab',                                 'Amy Winehouse'),
  ( 9, 'Hot in Herre',                          'Nelly'),
  (10, 'SexyBack',                              'Justin Timberlake'),
  (11, 'Yeah!',                                 'Usher'),
  (12, 'In Da Club',                            '50 Cent'),
  (13, 'The Scientist',                         'Coldplay'),
  (14, 'Chasing Cars',                          'Snow Patrol'),
  (15, 'In the End',                            'Linkin Park'),
  (16, 'Feel Good Inc.',                        'Gorillaz'),
  (17, 'Welcome to the Black Parade',           'My Chemical Romance'),
  (18, 'Sugar We''re Goin Down',                'Fall Out Boy'),
  (19, 'Umbrella',                              'Rihanna'),
  (20, 'Beautiful Day',                         'U2'),
  (21, 'Can''t Get You Out of My Head',         'Kylie Minogue'),
  (22, 'Toxic',                                 'Britney Spears'),
  (23, 'Work It',                               'Missy Elliott'),
  (24, 'Hips Don''t Lie',                       'Shakira'),
  (25, 'Beautiful',                             'Christina Aguilera'),
  (26, 'Numb',                                  'Linkin Park'),
  (27, 'Stacy''s Mom',                          'Fountains of Wayne'),
  (28, 'Mr. Brightside',                        'The Killers'),
  (29, 'Somebody That I Used to Know',          'Gotye'),
  (30, 'Rolling in the Deep',                   'Adele')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── Rock Classics ───────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DWXRqgorJj26U')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Bohemian Rhapsody',                     'Queen'),
  ( 2, 'Don''t Stop Me Now',                    'Queen'),
  ( 3, 'We Will Rock You',                      'Queen'),
  ( 4, 'Paint It, Black',                       'The Rolling Stones'),
  ( 5, 'Sympathy for the Devil',                'The Rolling Stones'),
  ( 6, 'Back in Black',                         'AC/DC'),
  ( 7, 'Highway to Hell',                       'AC/DC'),
  ( 8, 'Welcome to the Jungle',                 'Guns N'' Roses'),
  ( 9, 'Sweet Child O'' Mine',                  'Guns N'' Roses'),
  (10, 'Enter Sandman',                         'Metallica'),
  (11, 'Nothing Else Matters',                  'Metallica'),
  (12, 'Come as You Are',                       'Nirvana'),
  (13, 'Smells Like Teen Spirit',               'Nirvana'),
  (14, 'Californication',                       'Red Hot Chili Peppers'),
  (15, 'Under the Bridge',                      'Red Hot Chili Peppers'),
  (16, 'Hotel California',                      'Eagles'),
  (17, 'Go Your Own Way',                       'Fleetwood Mac'),
  (18, 'Heroes',                                'David Bowie'),
  (19, 'With or Without You',                   'U2'),
  (20, 'Born to Run',                           'Bruce Springsteen'),
  (21, 'Free Fallin''',                         'Tom Petty'),
  (22, 'Losing My Religion',                    'R.E.M.'),
  (23, 'Creep',                                 'Radiohead'),
  (24, 'Smoke on the Water',                    'Deep Purple'),
  (25, 'Iron Man',                              'Black Sabbath'),
  (26, 'Whole Lotta Love',                      'Led Zeppelin'),
  (27, 'Roxanne',                               'The Police'),
  (28, 'Comfortably Numb',                      'Pink Floyd'),
  (29, 'Dream On',                              'Aerosmith'),
  (30, 'More Than a Feeling',                   'Boston')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── Viva Latino ─────────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DX10zKzsJ2jva')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Despacito',                             'Luis Fonsi'),
  ( 2, 'Mi Gente',                              'J Balvin'),
  ( 3, 'Dakiti',                                'Bad Bunny'),
  ( 4, 'Gasolina',                              'Daddy Yankee'),
  ( 5, 'Hips Don''t Lie',                       'Shakira'),
  ( 6, 'Bailando',                              'Enrique Iglesias'),
  ( 7, 'Hawái',                                 'Maluma'),
  ( 8, 'Taki Taki',                             'DJ Snake'),
  ( 9, 'Vivir Mi Vida',                         'Marc Anthony'),
  (10, 'Smooth',                                'Santana'),
  (11, 'La Copa de la Vida',                    'Ricky Martin'),
  (12, 'Propuesta Indecente',                   'Romeo Santos'),
  (13, 'La Bilirrubina',                        'Juan Luis Guerra'),
  (14, 'La Vida Es Un Carnaval',                'Celia Cruz'),
  (15, 'Mayores',                               'Becky G'),
  (16, 'Havana',                                'Camila Cabello'),
  (17, 'Give Me Everything',                    'Pitbull'),
  (18, 'Danza Kuduro',                          'Don Omar'),
  (19, 'Con Calma',                             'Daddy Yankee'),
  (20, 'MIA',                                   'Bad Bunny'),
  (21, 'x (EQUIS)',                             'Nicky Jam'),
  (22, 'Como La Flor',                          'Selena'),
  (23, 'Bidi Bidi Bom Bom',                     'Selena'),
  (24, 'Baila Baila Baila',                     'Ozuna'),
  (25, 'Diles',                                 'Bad Bunny'),
  (26, 'Loco Contigo',                          'DJ Snake'),
  (27, 'Duele El Corazon',                      'Enrique Iglesias'),
  (28, 'La Tortura',                            'Shakira'),
  (29, 'Te Bote',                               'Casper Mágico'),
  (30, 'Lean On',                               'Major Lazer')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ─────────────────────────── Dance Hits ──────────────────────
WITH p AS (SELECT id FROM playlists WHERE spotify_id = '37i9dQZF1DXaXB8fQg7xof')
INSERT INTO preset_tracks (playlist_id, name, artist, sort_order)
SELECT p.id, t.name, t.artist, t.n
FROM p CROSS JOIN (VALUES
  ( 1, 'Get Lucky',                             'Daft Punk'),
  ( 2, 'Around the World',                      'Daft Punk'),
  ( 3, 'Feel So Close',                         'Calvin Harris'),
  ( 4, 'Summer',                                'Calvin Harris'),
  ( 5, 'Wake Me Up',                            'Avicii'),
  ( 6, 'Levels',                                'Avicii'),
  ( 7, 'Titanium',                              'David Guetta'),
  ( 8, 'Without You',                           'David Guetta'),
  ( 9, 'Animals',                               'Martin Garrix'),
  (10, 'Latch',                                 'Disclosure'),
  (11, 'Firestone',                             'Kygo'),
  (12, 'Don''t You Worry Child',                'Swedish House Mafia'),
  (13, 'One (Your Name)',                       'Swedish House Mafia'),
  (14, 'Beautiful Now',                         'Zedd'),
  (15, 'The Middle',                            'Zedd'),
  (16, 'Happier',                               'Marshmello'),
  (17, 'Alone',                                 'Marshmello'),
  (18, 'Heroes (We Could Be)',                  'Alesso'),
  (19, 'Prayer in C',                           'Robin Schulz'),
  (20, 'Runaway (U & I)',                       'Galantis'),
  (21, 'Rather Be',                             'Clean Bandit'),
  (22, 'Rockabye',                              'Clean Bandit'),
  (23, 'Love Me Again',                         'John Newman'),
  (24, 'King',                                  'Years & Years'),
  (25, 'Burn',                                  'Ellie Goulding'),
  (26, 'I Got U',                               'Duke Dumont'),
  (27, 'Lean On',                               'Major Lazer'),
  (28, 'One Dance',                             'Drake'),
  (29, 'Saxobeat',                              'Alexandra Stan'),
  (30, 'Barbra Streisand',                      'Duck Sauce')
) AS t(n, name, artist)
ON CONFLICT (playlist_id, name, artist) DO NOTHING;


-- ── Verificación ─────────────────────────────────────────────
-- Ejecuta esto al final para confirmar que todo se insertó bien:
--
-- SELECT pl.name AS playlist, COUNT(pt.id) AS tracks
-- FROM playlists pl
-- LEFT JOIN preset_tracks pt ON pt.playlist_id = pl.id
-- WHERE pl.is_preset = true
-- GROUP BY pl.name
-- ORDER BY pl.name;
