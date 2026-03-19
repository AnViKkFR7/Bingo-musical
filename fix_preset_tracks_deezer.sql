-- ============================================================
-- FIX PRESET TRACKS — Deezer preview audit
-- Ejecutar en el SQL Editor de Supabase.
-- Todos los UPDATE usan el id exacto del registro (columna 1 del CSV).
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TOP 30 ITALIA
--    Lucio Battisti "Emozioni" → NO está en ninguna plataforma
--    de streaming (la herencia bloquea los derechos desde 1998).
--    Reemplazamos con Adriano Celentano "Azzurro" (1968),
--    disponible en Deezer y muy conocida por el público italiano.
-- ──────────────────────────────────────────────────────────────
UPDATE preset_tracks
SET name   = 'Azzurro',
    artist = 'Adriano Celentano'
WHERE id = '645908f1-be79-47b6-8d10-92affa3ef4ed';
-- Antes: "Emozioni" — Lucio Battisti  (sort 26)
-- Después: "Azzurro" — Adriano Celentano

-- ──────────────────────────────────────────────────────────────
-- 2. TOP 30 FRANCE
--    Angèle "Broll" → "Brol" es el ÁLBUM, no una canción.
--    La búsqueda estricta y libre en Deezer van a fallar.
--    Reemplazamos con "Balance ton quoi" (su mayor hit, viral 2018-19).
-- ──────────────────────────────────────────────────────────────
UPDATE preset_tracks
SET name = 'Balance ton quoi'
WHERE id = 'fa1bf712-76d9-4253-b3e8-c543da17d9c8';
-- Antes: "Broll" — Angèle  (sort 9)
-- Después: "Balance ton quoi" — Angèle  (artista no cambia)

-- ──────────────────────────────────────────────────────────────
-- 3. TOP 30 ESPAÑA — Bzrp Music Sessions, tres correcciones
-- ──────────────────────────────────────────────────────────────

-- 3a. Sort 12: "Bzrp Music Sessions #53" por "Bizarrap"
--     Es el MISMO tema que sort 21 ("Shakira: Bzrp Music Sessions...").
--     Duplicado dentro del mismo playlist.
--     Lo reemplazamos con "Monotonía" de Shakira & Ozuna,
--     que ya tiene presencia masiva en Deezer y no está en la lista.
UPDATE preset_tracks
SET name   = 'Monotonía',
    artist = 'Shakira & Ozuna'
WHERE id = '16598451-1de1-4572-b3ac-fe8ba261ea8a';
-- Antes: "Bzrp Music Sessions #53" — Bizarrap  (sort 12, duplicado)
-- Después: "Monotonía" — Shakira & Ozuna

-- 3b. Sort 13: artista "Quevedo" está mal (es Bizarrap el artista
--     principal). El título también difiere del formato Deezer.
UPDATE preset_tracks
SET name   = 'Quevedo: Bzrp Music Sessions, Vol. 52',
    artist = 'Bizarrap'
WHERE id = '26c290f5-7a6f-4f07-b4f2-9acafb9cf848';
-- Antes: "Bzrp Music Sessions #52" — Quevedo  (sort 13)
-- Después: "Quevedo: Bzrp Music Sessions, Vol. 52" — Bizarrap

-- 3c. Sort 21: título correcto pero le falta la coma antes de "Vol."
UPDATE preset_tracks
SET name = 'Shakira: Bzrp Music Sessions, Vol. 53'
WHERE id = '8bc6d74f-e531-4d3c-bc69-c4e1f8cbfbe6';
-- Antes: "Shakira: Bzrp Music Sessions Vol. 53" — Bizarrap  (sort 21)
-- Después: "Shakira: Bzrp Music Sessions, Vol. 53" — Bizarrap

-- ──────────────────────────────────────────────────────────────
-- 4. TOP 30 CATALUNYA — Bzrp Music Sessions, dos correcciones
--    En el CSV el artista está como "Shakira"/"Quevedo" en lugar
--    de "Bizarrap" (artista principal en Deezer), y falta la "s"
--    en "Sessions". La búsqueda con artista incorrecto fallará
--    en el intento estricto y probablemente también en el libre.
-- ──────────────────────────────────────────────────────────────

-- Sort 17 (vol. 53):
UPDATE preset_tracks
SET name   = 'Shakira: Bzrp Music Sessions, Vol. 53',
    artist = 'Bizarrap'
WHERE id = 'eebbfb53-508f-4a38-8f4e-17812fc43e84';
-- Antes: "Bzrp Music Session Vol. 53" — Shakira
-- Después: "Shakira: Bzrp Music Sessions, Vol. 53" — Bizarrap

-- Sort 18 (vol. 52):
UPDATE preset_tracks
SET name   = 'Quevedo: Bzrp Music Sessions, Vol. 52',
    artist = 'Bizarrap'
WHERE id = '7094976e-81fd-4eae-ae06-fbb7e26311bc';
-- Antes: "Bzrp Music Session Vol. 52" — Quevedo
-- Después: "Quevedo: Bzrp Music Sessions, Vol. 52" — Bizarrap

-- ============================================================
-- 5. TOP 30 ILLENIUM — dos problemas sistémicos
--
--  PROBLEMA A) El campo artist de TODOS los tracks contiene
--    "ft. X" o "& X" (ej: "Illenium ft. Dia Frampton").
--    La búsqueda ESTRICTA en Deezer hace:
--      artist:"Illenium ft. Dia Frampton" track:"Needed You"
--    y devuelve 0 resultados porque el artista en Deezer
--    es simplemente "Illenium". Esto revienta el preview
--    en TODOS los tracks del playlist.
--
--  FIX A) Batch-update: artist = 'Illenium' para todo el
--    playlist (la búsqueda estricta pasará a ser correcta).
--
--  PROBLEMA B) Varios tracks con artistas invitados muy
--    oscuros no están en Deezer: Vowws, King Deco, Ember
--    Island (obscure), Spiritbox (metal crossover),
--    Nothing,Nowhere. (emo-rap). Además sort 29 es un track
--    de Kygo & Ellie Goulding, que no pertenece a Illenium.
--
--  FIX B) Reemplazar esos 8 tracks por hits de Illenium bien
--    distribuidos y con preview confirmado en Deezer.
-- ============================================================

-- ── 5a. Reemplazos de tracks (sort → nuevo track) ────────────

-- Sort 8: Free Fall ft. Ember Island → Pray (Ashes album, 2016)
UPDATE preset_tracks
SET name = 'Pray', artist = 'Illenium'
WHERE id = '06608af0-d3d5-4bb0-ba42-f0b57d833dc3';

-- Sort 10: Where'd U Go ft. Ember Island → I Care (Ascend, 2019)
UPDATE preset_tracks
SET name = 'I Care', artist = 'Illenium'
WHERE id = 'a1086d87-cb66-4272-b818-1e6620ebe8a5';

-- Sort 17: Reverie ft. King Deco → Hold On (Awake, 2018)
UPDATE preset_tracks
SET name = 'Hold On', artist = 'Illenium'
WHERE id = '5cf9bd8d-c539-4ce6-bd80-45f782fd1dcc';

-- Sort 19: Get Away ft. Vowws → Oh Well (2023)
UPDATE preset_tracks
SET name = 'Oh Well', artist = 'Illenium'
WHERE id = '324a42b2-78cd-46b2-aa39-ba570c520128';

-- Sort 20: Every Second ft. Frank Walker & Runn → Story of My Life (Ashes, 2023)
UPDATE preset_tracks
SET name = 'Story of My Life', artist = 'Illenium'
WHERE id = 'f03cc7b7-da37-412d-9e73-7576fb495cd1';

-- Sort 26: With You ft. Spiritbox → Sparks (Fallen Embers, 2021)
UPDATE preset_tracks
SET name = 'Sparks', artist = 'Illenium'
WHERE id = 'c1a19119-0fda-4a38-bab2-b2ac8d3cc5ff';

-- Sort 27: Wouldn't Change A Thing ft. Nothing,Nowhere. → Sound of Waking (Ashes, 2023)
UPDATE preset_tracks
SET name = 'Sound of Waking', artist = 'Illenium'
WHERE id = 'fbfa3e8e-73b1-4403-b1d1-310d09bcaffe';

-- Sort 29: First Time — Kygo & Ellie Goulding [TRACK INCORRECTO]
--          → Heavenly Side (Fallen Embers, 2021)
UPDATE preset_tracks
SET name = 'Heavenly Side', artist = 'Illenium'
WHERE id = 'b5f0ec72-4381-4804-ab97-d497dad63621';

-- ── 5b. Batch-fix artista para todos los tracks restantes ────
-- Cambia "Illenium ft. X", "Illenium & X ft. Y" → "Illenium"
-- Solo afecta a filas que aún no tengan artist = 'Illenium'
-- (los 8 reemplazados arriba ya quedan a 'Illenium').
UPDATE preset_tracks
SET artist = 'Illenium'
WHERE playlist_id = 'c57d565c-164e-4930-9668-09d63fcb3d73'
  AND artist <> 'Illenium';

-- ──────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después de los UPDATE)
-- ──────────────────────────────────────────────────────────────
-- Checks 1-4 (tracks individuales)
SELECT pt.id, pt.name, pt.artist, pt.sort_order,
       pl.name AS playlist
FROM preset_tracks pt
JOIN preset_playlists pl ON pl.id = pt.playlist_id
WHERE pt.id IN (
  '645908f1-be79-47b6-8d10-92affa3ef4ed',
  'fa1bf712-76d9-4253-b3e8-c543da17d9c8',
  '16598451-1de1-4572-b3ac-fe8ba261ea8a',
  '26c290f5-7a6f-4f07-b4f2-9acafb9cf848',
  '8bc6d74f-e531-4d3c-bc69-c4e1f8cbfbe6',
  'eebbfb53-508f-4a38-8f4e-17812fc43e84',
  '7094976e-81fd-4eae-ae06-fbb7e26311bc'
)
ORDER BY pl.name, pt.sort_order;

-- Check 5: Top 30 Illenium completo — todos deben tener artist='Illenium'
SELECT sort_order, name, artist
FROM preset_tracks
WHERE playlist_id = 'c57d565c-164e-4930-9668-09d63fcb3d73'
ORDER BY sort_order;

-- Sanity: no debe quedar ningún track con 'ft.' en el artista
SELECT COUNT(*) AS tracks_con_ft_en_artista
FROM preset_tracks
WHERE playlist_id = 'c57d565c-164e-4930-9668-09d63fcb3d73'
  AND artist ILIKE '%ft.%';
