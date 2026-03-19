-- ============================================================
-- 001_security.sql
-- Capa de seguridad para Bingo Musical
--
-- Qué hace:
--   1. Añade `auth_user_id` a `players` para enlazar cada jugador
--      con la sesión anónima de Supabase Auth.
--   2. Habilita RLS en todas las tablas.
--   3. Define políticas que garantizan que cada usuario solo puede
--      leer datos públicos y escribir únicamente los suyos.
--   4. Las operaciones críticas del DJ (start game) se ejecutan
--      desde una Edge Function con service_role, que omite RLS.
--
-- Instrucciones:
--   Ejecutar en Supabase → SQL Editor.
--   Es idempotente: usa IF NOT EXISTS / DO $$ … END $$.
-- ============================================================


-- ── 1. Añadir columna auth_user_id a players ─────────────────

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_players_auth_user_id
  ON players(auth_user_id);


-- ── 2. Habilitar RLS en todas las tablas ─────────────────────

ALTER TABLE playlists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE games        ENABLE ROW LEVEL SECURITY;
ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_tracks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_marks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_tracks ENABLE ROW LEVEL SECURITY;


-- ── 3. Políticas ──────────────────────────────────────────────
--
-- Convención de nombres: <tabla>_<operación>_<quién>
-- anon        = usuario sin sesión (no debería existir con anon auth activo)
-- authenticated = usuario con sesión anónima (todos los jugadores)
-- service_role  = Edge Functions del backend (omite RLS, no necesita política)


-- ─── preset_tracks ───────────────────────────────────────────
-- SELECT: público (catálogo de canciones de playlists preset).
-- Escritura solo desde el dashboard/service_role (datos editoriales).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='preset_tracks' AND policyname='preset_tracks_select_all') THEN
    EXECUTE $p$ CREATE POLICY preset_tracks_select_all ON preset_tracks FOR SELECT USING (true) $p$;
  END IF;
END $$;


-- ─── playlists ───────────────────────────────────────────────
-- Lectura pública (catálogo de playlists para la pantalla de crear partida).
-- Escritura solo desde el dashboard/service_role.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='playlists' AND policyname='playlists_select_all') THEN
    EXECUTE $p$ CREATE POLICY playlists_select_all ON playlists FOR SELECT USING (true) $p$;
  END IF;
END $$;


-- ─── games ───────────────────────────────────────────────────
-- SELECT: cualquier sesión puede leer (para unirse por código).
-- INSERT: solo usuarios autenticados (tiene sesión anónima).
-- UPDATE: solo el host de la partida puede modificarla.
--         Comprueba que auth.uid() coincide con el auth_user_id
--         del jugador que es host_player_id de la partida.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_select_all') THEN
    EXECUTE $p$ CREATE POLICY games_select_all ON games FOR SELECT USING (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_insert_auth') THEN
    EXECUTE $p$
      CREATE POLICY games_insert_auth ON games
        FOR INSERT TO authenticated
        WITH CHECK (true);
    $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='games' AND policyname='games_update_host') THEN
    EXECUTE $p$
      CREATE POLICY games_update_host ON games
        FOR UPDATE TO authenticated
        USING (
          -- Permite el UPDATE si el host_player_id aún no está asignado (bootstrap al crear partida)
          -- o si el caller ya es el host actual.
          host_player_id IS NULL
          OR host_player_id IN (
            SELECT id FROM players WHERE auth_user_id = auth.uid()
          )
        )
        WITH CHECK (
          -- Tras el UPDATE, el nuevo host_player_id debe pertenecer al caller.
          host_player_id IN (
            SELECT id FROM players WHERE auth_user_id = auth.uid()
          )
        );
    $p$;
  END IF;
END $$;


-- ─── players ─────────────────────────────────────────────────
-- SELECT: público (para ver la lista de jugadores en la sala).
-- INSERT: solo el propio usuario, y solo para su propia sesión.
--         WITH CHECK impide que alguien inserte un jugador con
--         el auth_user_id de otro usuario.
-- UPDATE/DELETE: no permitido desde el frontend.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='players' AND policyname='players_select_all') THEN
    EXECUTE $p$ CREATE POLICY players_select_all ON players FOR SELECT USING (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='players' AND policyname='players_insert_self') THEN
    EXECUTE $p$
      CREATE POLICY players_insert_self ON players
        FOR INSERT TO authenticated
        WITH CHECK (auth_user_id = auth.uid());
    $p$;
  END IF;
END $$;


-- ─── game_tracks ─────────────────────────────────────────────
-- SELECT: público (todos los jugadores ven las tracks de la partida).
-- INSERT: solo el host (via Edge Function game-start con service_role).
-- UPDATE: solo el host (via DJPanel — marca played_at).
--         También cubierto por service_role en el Edge Function.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_tracks' AND policyname='game_tracks_select_all') THEN
    EXECUTE $p$ CREATE POLICY game_tracks_select_all ON game_tracks FOR SELECT USING (true) $p$;
  END IF;
  -- INSERT: solo via service_role (Edge Function game-start). No política para authenticated.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='game_tracks' AND policyname='game_tracks_update_host') THEN
    EXECUTE $p$
      CREATE POLICY game_tracks_update_host ON game_tracks
        FOR UPDATE TO authenticated
        USING (
          game_id IN (
            SELECT g.id FROM games g
            JOIN players p ON p.id = g.host_player_id
            WHERE p.auth_user_id = auth.uid()
          )
        );
    $p$;
  END IF;
END $$;


-- ─── boards ──────────────────────────────────────────────────
-- SELECT: público (el DJ necesita ver todos los cartones).
-- INSERT: solo el propio jugador al unirse.
-- UPDATE: el jugador actualiza su propio cartón (has_line, has_bingo).
--         El host actualiza track_positions via service_role (Edge Function).
--         Ambos casos cubiertos por la política de abajo.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boards' AND policyname='boards_select_all') THEN
    EXECUTE $p$ CREATE POLICY boards_select_all ON boards FOR SELECT USING (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boards' AND policyname='boards_insert_self') THEN
    EXECUTE $p$
      CREATE POLICY boards_insert_self ON boards
        FOR INSERT TO authenticated
        WITH CHECK (
          player_id IN (SELECT id FROM players WHERE auth_user_id = auth.uid())
        );
    $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='boards' AND policyname='boards_update_self') THEN
    EXECUTE $p$
      CREATE POLICY boards_update_self ON boards
        FOR UPDATE TO authenticated
        USING (
          player_id IN (SELECT id FROM players WHERE auth_user_id = auth.uid())
        );
    $p$;
  END IF;
END $$;


-- ─── board_marks ─────────────────────────────────────────────
-- SELECT: el jugador ve sus propias marcas (y via Realtime las del canal).
-- INSERT: solo el jugador puede marcar su propio cartón.
--         La política comprueba que el board_id pertenece al auth.uid().

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='board_marks' AND policyname='board_marks_select_all') THEN
    EXECUTE $p$ CREATE POLICY board_marks_select_all ON board_marks FOR SELECT USING (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='board_marks' AND policyname='board_marks_insert_self') THEN
    EXECUTE $p$
      CREATE POLICY board_marks_insert_self ON board_marks
        FOR INSERT TO authenticated
        WITH CHECK (
          board_id IN (
            SELECT b.id FROM boards b
            JOIN players p ON p.id = b.player_id
            WHERE p.auth_user_id = auth.uid()
          )
        );
    $p$;
  END IF;
END $$;


-- ── Verificación (ejecutar después para confirmar) ────────────
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('playlists','games','players','game_tracks','boards','board_marks','preset_tracks')
-- ORDER BY tablename, policyname;
