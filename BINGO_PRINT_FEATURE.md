# 🖨️ MusiBingo — Generador de Cartones Imprimibles

> Este documento describe la nueva funcionalidad de generación y venta de cartones de bingo imprimibles. Se integra en el proyecto existente **MusiBingo** (React 18 + Vite + Supabase). Léelo íntegramente antes de escribir cualquier línea de código.

---

## 1. Visión general

Nueva sección accesible desde la navegación principal (`/imprimir`) que permite a cualquier usuario:

1. Seleccionar una playlist de Spotify
2. Configurar los parámetros del lote de cartones
3. Elegir y personalizar un diseño de cartón
4. Pagar 1,99 € (mockeado en esta fase)
5. Descargar los cartones en PDF o recibirlos por email

Los cartones generados son **físicos/imprimibles**, independientes del sistema de partidas online. Esta funcionalidad **no usa las APIs de Spotify ni Deezer en tiempo real durante el juego**, solo para obtener los metadatos de las canciones en el momento de la compra, lo que reduce la exposición a los términos de uso.

---

## 2. Integración con el proyecto existente

### 2.1 Reutilización de componentes

| Componente existente | Uso en esta feature |
|---|---|
| `PresetPlaylistGrid` | Paso 1: selección de playlist preset |
| `PlaylistSearch` | Paso 1: búsqueda de playlist |
| `PlaylistUrlInput` | Paso 1: pegar URL de Spotify |
| `PlaylistPreview` | Paso 1: vista previa de playlist seleccionada |
| `Header` / `Layout` | Wrapper de la nueva página |
| Edge Function `spotify-get-playlist-tracks` | Obtener canciones de la playlist |
| `i18next` | Internacionalización de todos los textos nuevos |
| Paleta de colores y tipografía (Nunito) | Consistencia visual |

### 2.2 Nueva ruta

```
/imprimir   →   PrintPage
```

Añadir enlace en `Header.tsx` junto al resto de navegación.

### 2.3 Nuevas variables de entorno

```bash
# .env / .env.example — añadir a las existentes
VITE_PRINT_PRICE_EUR=1.99          # Precio mostrado al usuario
VITE_EMAILJS_SERVICE_ID=           # Para envío por email (fase futura)
VITE_EMAILJS_TEMPLATE_ID=          # Para envío por email (fase futura)
VITE_EMAILJS_PUBLIC_KEY=           # Para envío por email (fase futura)
```

---

## 3. Flujo completo de usuario

```
/imprimir
    │
    ├── Paso 1: Selección de playlist
    │       └── (igual que CreateGamePage: presets, búsqueda, URL)
    │
    ├── Paso 2: Configuración del lote
    │       ├── Tamaño de cartón: 3×3 / 4×4 / 5×5
    │       ├── Número de jugadores: 1–50
    │       └── Número de partidas: 1–10
    │           └── Total cartones = jugadores × partidas (mostrar en tiempo real)
    │
    ├── Paso 3: Diseño y personalización
    │       ├── Selección de diseño (3 opciones visuales)
    │       ├── Título personalizado (texto libre, max 40 chars)
    │       └── Preview en tiempo real del cartón de muestra
    │
    ├── Paso 4: Pago (MOCKEADO)
    │       ├── Resumen del pedido
    │       ├── Precio: 1,99 €
    │       └── Botón "Pagar y generar" → simula pago exitoso
    │
    └── Paso 5: Descarga / Envío
            ├── Generación del PDF en el navegador (client-side)
            ├── Botón "Descargar PDF"
            └── Opción "Enviar por email" (input email + botón)
```

---

## 4. Páginas y componentes nuevos

### 4.1 Página principal

**`src/pages/PrintPage.tsx`**

Wizard de 5 pasos con barra de progreso. Gestiona el estado global del flujo con `useState` local (no necesita Zustand, es un flujo lineal sin Realtime).

Estado interno del wizard:
```typescript
interface PrintWizardState {
  step: 1 | 2 | 3 | 4 | 5
  playlist: SelectedPlaylist | null      // spotify_id, name, image_url, tracks
  boardSize: 3 | 4 | 5
  numPlayers: number                     // 1–50
  numGames: number                       // 1–10
  designId: 'festivo' | 'retro' | 'verde'
  customTitle: string                    // max 40 chars
  paymentDone: boolean
  generatedBoards: PrintableBoard[][]   // [partida][jugador]
  deliveryEmail: string
}
```

### 4.2 Componentes del wizard

**`src/components/print/PrintStepIndicator.tsx`**
Barra de progreso con 5 pasos numerados y etiquetas. Usa la paleta existente (teal para paso activo, cream para completados, dark para pendientes).

**`src/components/print/PrintStep1Playlist.tsx`**
Reutiliza `PresetPlaylistGrid`, `PlaylistSearch`, `PlaylistUrlInput` y `PlaylistPreview` tal como están. Llama a la Edge Function `spotify-get-playlist-tracks` para validar que hay suficientes tracks.

Validación mínima de tracks:
```typescript
const MIN_TRACKS: Record<3|4|5, number> = { 3: 9, 4: 16, 5: 25 }
// Aviso si tracks_total < MIN_TRACKS[boardSize] (misma lógica que CreateGamePage)
```

**`src/components/print/PrintStep2Config.tsx`**
Tres controles:
- Selector de tamaño de cartón (radio buttons: 3×3 / 4×4 / 5×5)
- Slider o input numérico de jugadores (1–50)
- Slider o input numérico de partidas (1–10)
- Indicador dinámico: `Total de cartones: X × Y = Z cartones únicos`

**`src/components/print/PrintStep3Design.tsx`**
- Grid de 3 tarjetas de diseño seleccionables (ver sección 5)
- Input de texto para título personalizado con contador de caracteres
- Panel de preview del cartón de muestra usando canciones reales de la playlist seleccionada

**`src/components/print/PrintStep4Payment.tsx`**
- Resumen del pedido: playlist, tamaño, jugadores, partidas, diseño, título
- Precio: **1,99 €**
- Botón "Pagar y generar cartones"
- **Comportamiento mockeado:** al pulsar el botón, espera 1,5 s (spinner) y procede directamente al paso 5 sin integración real de pago
- Añadir comentario en el código: `// TODO: Integrar pasarela de pago real (Stripe/PayPal)`
- Texto bajo el botón: "Pago seguro · Garantía de satisfacción"

**`src/components/print/PrintStep5Download.tsx`**
- Mensaje de éxito con animación
- Botón "Descargar PDF" → genera y descarga el PDF
- Spinner mientras se genera el PDF
- Separador "o"
- Input de email + botón "Enviar por email"
  - En esta fase: muestra mensaje "¡Email enviado!" tras 1 s (mockeado)
  - Añadir comentario: `// TODO: Integrar EmailJS o Supabase Edge Function para envío real`

---

## 5. Diseños de cartón

### 5.1 Tres diseños preestablecidos

Los diseños se implementan como configuraciones de estilo que el componente `PrintableBingoCard` aplica dinámicamente. No son imágenes estáticas, son variaciones del mismo componente React/HTML renderizado a PDF.

Todos los diseños comparten la misma estructura: **cabecera** (título principal + subtítulo/título personalizado) + **grid de celdas** solo con texto (título canción + artista, sin imagen de álbum).

---

#### Diseño 1 — `festivo` ("Bingo Musical · Rosa")

Inspirado en una estética candy/pop colorida.

**Cabecera:**
- Fondo rosa pastel (`#f9a8c9` aprox.)
- Título "Bingo Musical" en tipografía script/cursiva grande, color rojo oscuro (`#c0392b`)
- Subtítulo con el título personalizado del usuario en mayúsculas espaciadas, color oscuro
- Ilustraciones decorativas en las esquinas (radio cassette y personaje musical estilo cartoon). Usar emojis grandes o SVGs simples si no hay assets disponibles: 📻 🎵
- Sin borde exterior

**Celdas:**
- Las celdas alternan entre una paleta de 6 colores sin patrón fijo (aspecto "confeti"):
  `#c0392b` (rojo), `#e8a0bf` (rosa claro), `#f4a261` (naranja), `#9b59b6` (morado), `#f8c8d4` (rosa muy claro), `#ffffff` (blanco)
- Texto del título de la canción: blanco o rojo oscuro según contraste del fondo de celda, negrita, tamaño mediano
- Texto del artista: misma lógica de contraste, tamaño pequeño, peso normal
- Sin borde entre celdas (las celdas de colores ya las delimitan visualmente)
- Las celdas con fondo blanco llevan el texto en rojo oscuro

**Footer:** ninguno

---

#### Diseño 2 — `retro` ("Bingo Musical · Lila")

Estética vintage de ordenador/ventana de aplicación.

**Cabecera:**
- Fondo general lila/periwinkle (`#c5c8f0` aprox.)
- Borde exterior grueso marrón oscuro (`#3d1a0e`), esquinas redondeadas suaves
- Barra superior estilo "barra de título de ventana" en marrón oscuro con 3 pequeños cuadrados (□□□) a la derecha, simulando botones de ventana
- Título "Bingo Musical" en negrita grande, color marrón oscuro, subrayado
- Subtítulo con el título personalizado en negrita, color marrón oscuro, tamaño mediano
- Ilustraciones en esquinas inferiores: personajes cartoon estilo retro (lápiz y nota musical). Usar emojis: ✏️ 🎵 o usar avatares de: src\public\avatares

**Celdas:**
- Fondo lila claro (igual que el fondo general, `#c5c8f0`)
- Grid con líneas de borde marrón oscuro (`#3d1a0e`), grosor 1–2px
- Texto del título de la canción: marrón oscuro, negrita, tamaño mediano
- Texto del artista: marrón oscuro, peso normal, tamaño pequeño
- Sin color de fondo diferenciado por celda (todas iguales)

**Footer:**
- Texto "@MusiBingo" centrado en marrón oscuro, tamaño pequeño, al pie del cartón (fuera del grid)

---

#### Diseño 3 — `verde` ("Bingo Musical · Verde")

Estética deportiva/moderna con contraste fuerte.

**Cabecera:**
- Fondo degradado vertical: verde lima claro (`#c8e63c`) arriba → verde medio (`#5cb85c`) abajo
- Texto "@MUSIBINGO" muy pequeño en verde oscuro, parte superior centrado
- Título personalizado del usuario en mayúsculas, tipografía extra-bold, color verde oscuro (`#1a5c2a`), tamaño grande
- Banner horizontal debajo del título: fondo naranja/amarillo (`#f5a623`), texto "BINGO MUSICAL" en mayúsculas bold, color oscuro

**Celdas:**
- Fondo del grid: verde medio (`#3d8b47`)
- Las celdas alternan entre dos tonos de verde en patrón ajedrezado:
  - Verde oscuro: `#2d6e35`
  - Verde medio: `#4a9e54`
- Texto del título de la canción: blanco, negrita, tamaño mediano
- Texto del artista: blanco/crema, peso normal, tamaño pequeño
- Sin borde entre celdas (el contraste de color las delimita)

**Footer:** ninguno

---

### 5.2 Contenido de cada celda

Todas las celdas en los tres diseños muestran **solo texto**, sin imagen de álbum:
- **Línea 1:** Nombre de la canción (negrita, truncado con ellipsis si supera 2 líneas)
- **Línea 2:** Nombre del artista (peso normal, tamaño ~80% del título, truncado si es necesario)

El componente `PrintableBingoCard` recibe las celdas como `TrackCell[]` y aplica el diseño seleccionado.

### 5.3 Cabecera del cartón

Cada cartón incluye en su cabecera, según el diseño:
- Título "Bingo Musical" (fijo, parte del diseño)
- Título personalizado por el usuario (o "Mi Bingo Musical" por defecto)
- Número de jugador y número de partida — mostrado de forma discreta en todos los diseños (ej: esquina superior izquierda o bajo el título, tamaño pequeño): `"Jugador 3 · Partida 2"`
- Handle "@MusiBingo" según el diseño (obligatorio en `retro` y `verde`, opcional en `festivo`)

---

## 6. Generación del PDF

### 6.1 Librería

Usar **`jsPDF`** + **`html2canvas`** para capturar los cartones renderizados en el DOM como HTML/CSS y exportarlos a PDF.

```bash
npm install jspdf html2canvas
```

Alternativa más ligera si hay problemas de rendimiento con muchos cartones: **`@react-pdf/renderer`** (renderiza directamente a PDF sin captura de pantalla). Evaluarlo en la fase 3, elegir la opción que produzca mejor resultado tipográfico.

### 6.2 Layout del PDF (distribución en páginas DIN A4)

DIN A4 = 210 × 297 mm. Márgenes de 10 mm por lado → área útil: 190 × 277 mm.

| Tamaño cartón | Cartones por hoja | Distribución |
|---|---|---|
| 3×3 | 4 por hoja | 2 columnas × 2 filas · cada cartón ≈ 95 × 138 mm |
| 4×4 | 4 por hoja | 2 columnas × 2 filas · cada cartón ≈ 95 × 138 mm |
| 5×5 | 3 por hoja | 1 columna × 3 filas · cada cartón ≈ 190 × 92 mm |

> El objetivo es **maximizar el uso de cada hoja** y **minimizar el número de páginas** a imprimir.

Lógica de paginación:
```typescript
const CARDS_PER_PAGE: Record<3|4|5, number> = { 3: 4, 4: 4, 5: 3 }

// Agrupar todos los cartones generados en chunks de CARDS_PER_PAGE
// Cada chunk = 1 página del PDF
```

El PDF se llama `musibingo-cartones.pdf`.

### 6.3 Orden de cartones en el PDF

El PDF organiza los cartones de forma que sea fácil repartirlos:
```
Partida 1: Jugador 1, Jugador 2, ..., Jugador N
Partida 2: Jugador 1, Jugador 2, ..., Jugador N
...
```

### 6.4 Imágenes de álbum en el PDF

Las imágenes de álbum se obtienen de las URLs de Spotify (HTTPS públicas). Convertir cada imagen a base64 antes de insertar en el PDF para evitar problemas CORS con jsPDF.

```typescript
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}
```

---

## 7. Generación de cartones únicos

### 7.1 Algoritmo

Cada cartón selecciona aleatoriamente `boardSize²` canciones de la playlist y las dispone en orden aleatorio. Los cartones deben ser **únicos entre sí** dentro del mismo lote.

```typescript
interface PrintableBoard {
  playerId: number    // 1..numPlayers
  gameId: number      // 1..numGames
  cells: TrackCell[]  // boardSize² celdas
}

interface TrackCell {
  spotify_id: string
  name: string
  artist: string
  album_image_url: string
}
```

Algoritmo de generación:
```typescript
function generateAllBoards(
  tracks: TrackCell[],
  boardSize: 3 | 4 | 5,
  numPlayers: number,
  numGames: number
): PrintableBoard[][] {
  // Para cada partida, generar numPlayers cartones únicos
  // Usar Fisher-Yates con semilla diferente por (gameIndex, playerIndex)
  // Verificar que no hay dos cartones idénticos en la misma partida
  // Si tracks.length < boardSize², lanzar error (ya validado en paso 1)
}
```

Si `tracks.length < boardSize² * 2`, los cartones pueden compartir algunas canciones pero el **orden** debe ser diferente. Documentar este caso en comentarios.

---

## 8. Internacionalización

Añadir las siguientes claves al archivo de traducciones (todos los idiomas: `es`, `en`, `ca`, `fr`, `it`):

```json
{
  "print": {
    "navLabel": "Imprimir cartones",
    "pageTitle": "Generador de cartones imprimibles",
    "pageSubtitle": "Crea cartones únicos para jugar sin pantallas",
    "step1Title": "Elige una playlist",
    "step2Title": "Configura el lote",
    "step3Title": "Elige el diseño",
    "step4Title": "Confirma y paga",
    "step5Title": "¡Listos para imprimir!",
    "numPlayers": "Número de jugadores",
    "numGames": "Número de partidas",
    "totalCards": "Total de cartones: {{total}}",
    "designFestivo": "Festivo",
    "designRetro": "Retro",
    "designVerde": "Verde",
    "customTitle": "Título del cartón",
    "customTitlePlaceholder": "MusiBingo · Cumpleaños de Ana",
    "customTitleHint": "Aparecerá en la cabecera de cada cartón (máx. 40 caracteres)",
    "orderSummary": "Resumen del pedido",
    "price": "Precio",
    "payButton": "Pagar y generar cartones",
    "paymentDisclaimer": "Pago seguro · Garantía de satisfacción",
    "generating": "Generando tus cartones...",
    "successTitle": "¡Tus cartones están listos!",
    "successSubtitle": "{{total}} cartones únicos generados",
    "downloadPdf": "Descargar PDF",
    "sendByEmail": "Enviar por email",
    "emailPlaceholder": "tu@email.com",
    "emailSend": "Enviar",
    "emailSent": "¡Email enviado!",
    "notEnoughTracks": "La playlist no tiene suficientes canciones para un cartón {{size}}×{{size}} (mínimo {{needed}})"
  }
}
```

---

## 9. Estructura de carpetas nueva

Añadir a la estructura existente del proyecto:

```
src/
  components/
    print/
      PrintStepIndicator.tsx
      PrintStep1Playlist.tsx
      PrintStep2Config.tsx
      PrintStep3Design.tsx
      PrintStep4Payment.tsx
      PrintStep5Download.tsx
      PrintableBingoCard.tsx      ← componente visual del cartón (usado en preview y PDF)
      PrintableBingoCard.module.css
  pages/
    PrintPage.tsx                 ← añadir a las páginas existentes
  lib/
    printBoards.ts                ← lógica de generación de cartones únicos
    generatePdf.ts                ← lógica de generación del PDF con jsPDF + html2canvas
```

Añadir en `App.tsx` / `React Router`:
```tsx
<Route path="/imprimir" element={<PrintPage />} />
```

Añadir en `Header.tsx`:
```tsx
<NavLink to="/imprimir">{t('print.navLabel')}</NavLink>
```

---

## 10. Plan de implementación por fases

> Entregar cada fase como un bloque de trabajo independiente. Verificar que compila y funciona antes de pasar a la siguiente.

---

### Fase 1 — Estructura y navegación

**Objetivo:** La página `/imprimir` existe, es accesible desde el header y muestra el wizard con los 5 pasos (sin funcionalidad real aún).

Tareas:
- Crear `PrintPage.tsx` con el estado del wizard y la lógica de navegación entre pasos
- Crear `PrintStepIndicator.tsx` con los 5 pasos y el estilo correcto
- Crear los 5 componentes de paso como stubs (solo título y botón "Siguiente")
- Añadir la ruta `/imprimir` en `App.tsx`
- Añadir el enlace en `Header.tsx`
- Añadir las claves i18n en todos los archivos de idioma

**Entregable:** Se puede navegar a `/imprimir` y avanzar/retroceder entre los 5 pasos vacíos.

---

### Fase 2 — Pasos 1 y 2: Playlist y configuración

**Objetivo:** El usuario puede seleccionar una playlist real de Spotify y configurar jugadores, partidas y tamaño.

Tareas:
- Implementar `PrintStep1Playlist.tsx` reutilizando `PresetPlaylistGrid`, `PlaylistSearch`, `PlaylistUrlInput` y `PlaylistPreview`
- Llamar a `spotify-get-playlist-tracks` y guardar las tracks en el estado del wizard
- Validar que hay suficientes tracks para el tamaño seleccionado (mostrar error si no)
- Implementar `PrintStep2Config.tsx` con los tres controles y el contador dinámico de cartones totales
- La validación de tracks mínimos debe re-ejecutarse si el usuario cambia el tamaño de cartón en el paso 2

**Entregable:** El usuario puede seleccionar playlist, ver la preview, configurar el lote y ver el total de cartones.

---

### Fase 3 — Paso 3: Diseño y preview

**Objetivo:** El usuario puede elegir un diseño y ver un preview real del cartón con canciones de la playlist.

Tareas:
- Implementar `PrintableBingoCard.tsx` con los tres diseños (`festivo`, `retro`, `verde`)
  - El componente acepta `{ design, title, cells, playerNum, gameNum, boardSize }` como props
  - Los estilos respetan las dimensiones del PDF (ver sección 6.2)
- Implementar `PrintStep3Design.tsx`:
  - Grid de 3 tarjetas de diseño seleccionables con preview miniatura de cada una
  - Input de título con contador de caracteres
  - Preview del cartón completo usando las primeras `boardSize²` canciones reales de la playlist
- Aplicar los estilos de cada diseño usando CSS Modules (un archivo `PrintableBingoCard.module.css`)

**Entregable:** El usuario ve un preview visual real del cartón que se va a imprimir.

---

### Fase 4 — Paso 4: Pago mockeado

**Objetivo:** El flujo de pago simula un cobro exitoso y desbloquea la generación.

Tareas:
- Implementar `PrintStep4Payment.tsx` con el resumen del pedido y el precio
- El botón "Pagar y generar cartones" dispara un `setTimeout` de 1,5 s (spinner) y luego:
  1. Ejecuta `generateAllBoards()` (implementar en `printBoards.ts`)
  2. Guarda los cartones en el estado del wizard
  3. Avanza al paso 5
- Implementar `printBoards.ts` con el algoritmo de generación de cartones únicos (sección 7)
- Añadir el comentario `// TODO: Integrar pasarela de pago real` en el lugar correspondiente

**Entregable:** Al "pagar", se generan todos los cartones en memoria.

---

### Fase 5 — Paso 5: Generación y descarga del PDF

**Objetivo:** El usuario puede descargar el PDF con todos los cartones correctamente maquetados.

Tareas:
- Implementar `generatePdf.ts`:
  - Instalar `jspdf` y `html2canvas`
  - Renderizar cada grupo de cartones (según `CARDS_PER_PAGE`) en un contenedor DOM oculto
  - Capturar con `html2canvas` y añadir al PDF con `jsPDF`
  - Respetar las dimensiones y distribución de la sección 6.2
  - Convertir las imágenes de álbum a base64 antes de renderizar
- Implementar `PrintStep5Download.tsx`:
  - Mensaje de éxito con animación
  - Botón "Descargar PDF" que llama a `generatePdf()` con spinner
  - Input de email con botón "Enviar" (mockeado: espera 1 s y muestra confirmación)
  - Añadir comentario `// TODO: Envío real por email`

**Entregable:** El usuario descarga un PDF funcional con todos sus cartones, correctamente distribuidos en páginas DIN A4.

---

## 11. Consideraciones técnicas adicionales

### 11.1 Rendimiento con lotes grandes

El caso extremo es 50 jugadores × 10 partidas = 500 cartones. La generación del PDF puede tardar varios segundos. Estrategia:

- Mostrar una barra de progreso durante la generación (`"Generando cartón X de Y..."`)
- Usar `requestAnimationFrame` o `setTimeout(fn, 0)` entre páginas para no bloquear el hilo principal
- Si el rendimiento es inaceptable en el navegador, evaluar mover la generación a una Edge Function de Supabase que devuelva el PDF como blob

### 11.2 CORS en imágenes de Spotify

Las imágenes de `i.scdn.co` (CDN de Spotify) suelen tener cabeceras CORS permisivas, pero puede variar. Si `html2canvas` no puede acceder, usar la técnica de proxy via Edge Function:

```typescript
// Edge Function: image-proxy
// GET /functions/v1/image-proxy?url=https://i.scdn.co/...
// Devuelve la imagen con cabeceras CORS correctas
```

### 11.3 Sin persistencia en base de datos

Los lotes generados **no se guardan en Supabase**. Son efímeros: se generan en memoria tras el pago y desaparecen al cerrar la pestaña. No se necesita ninguna tabla nueva en la base de datos para esta fase.

Si en el futuro se quiere guardar un historial de pedidos, añadir una tabla `print_orders` (fuera del alcance de esta implementación).

### 11.4 Responsive

El wizard de `/imprimir` está optimizado para **desktop** (el flujo de compra y la preview del cartón son más cómodos en pantalla grande). En móvil debe ser funcional pero no es la experiencia prioritaria.

### 11.5 Accesibilidad del wizard

- El paso activo debe tener `aria-current="step"`
- Los inputs de número deben tener `aria-label` descriptivo
- El botón de pago debe quedar deshabilitado (`disabled`) mientras el spinner está activo

---

## 12. Checklist de finalización

Antes de considerar la feature completa, verificar:

- [ ] La ruta `/imprimir` es accesible desde el header en todos los idiomas
- [ ] La selección de playlist funciona con presets, búsqueda y URL pegada
- [ ] La validación de tracks mínimos funciona y muestra error claro
- [ ] El contador de cartones totales se actualiza en tiempo real
- [ ] El preview del cartón refleja el diseño y título elegidos
- [ ] Los 3 diseños son visualmente distintos y reconocibles
- [ ] El flujo de pago mockeado funciona (spinner + avance automático)
- [ ] Los cartones generados son únicos entre sí dentro de cada partida
- [ ] El PDF se descarga correctamente y las imágenes aparecen
- [ ] La distribución en páginas es correcta (4 o 3 cartones por hoja según tamaño)
- [ ] El envío por email muestra la confirmación mockeada
- [ ] Todos los textos están traducidos en los 5 idiomas
- [ ] No hay errores de consola en ningún paso del flujo
- [ ] El proyecto compila sin errores TypeScript