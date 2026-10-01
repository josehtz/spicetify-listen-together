# Listen Together

Extensión de Spicetify que añade un custom app para crear salas de escucha en tiempo real dentro de Spotify. Un anfitrión crea una sala, comparte un ID de 8 caracteres, y los invitados se unen y escuchan exactamente la misma canción en sincronía: pista, posición y play/pausa.

Todo el tráfico de datos viaja directamente entre los participantes mediante WebRTC (PeerJS). No hay servidores de datos propios; solo se usa el servicio público de señalización de PeerJS y servidores STUN públicos para descubrir la ruta de conexión.

## Características

- Salas P2P con ID compartible (topología en estrella: todos se conectan al anfitrión)
- Sincronización automática de canción, posición y reproducción
- Solo el anfitrión controla play, pausa y salto; los invitados siguen su estado
- Cambio de canción del anfitrión propagado al instante al resto de la sala
- Chat integrado en la sala
- Contraseña opcional por sala
- Expulsar participantes
- Transferencia del rol de anfitrión a otro participante
- Avatares con iniciales, indicador de anfitrión y estado en directo
- Interfaz adaptada al tema de Spotify, sin emojis: solo iconos SVG

## Requisitos

- Spotify Desktop con [Spicetify](https://spicetify.app/) instalado y aplicado
- Una conexión estable a internet (la sala requiere que todos los participantes lleguen entre sí vía WebRTC/STUN)
- Node.js 16+ solo si quieres reconstruir el bundle de PeerJS

## Instalación

### Opción A: instalador

```powershell
.\install.ps1
```

### Opción B: manual

1. Copia la carpeta `app/` a `%APPDATA%\spicetify\CustomApps\listen-together\`
2. Ejecuta:

```powershell
spicetify config custom_apps listen-together
spicetify apply
```

3. Reinicia Spotify. Verás **Listen Together** en el menú lateral izquierdo.

## Uso

### Crear una sala

1. Abre **Listen Together** y pulsa **Crear sala**.
2. Escribe tu nombre y, opcionalmente, una contraseña.
3. Se genera un ID de 8 caracteres (por ejemplo `AB12CD34`).
4. Pulsa **Copiar** en la parte superior para enviar la invitación a tus amigos.

### Unirse a una sala

1. Abre **Listen Together** y pulsa **Unirse con ID**.
2. Escribe tu nombre, el ID recibido y la contraseña si la tiene.
3. Al conectarte, empiezas a escuchar lo que el anfitrión está reproduciendo.

### Reglas de la sala

- El anfitrión es quien controla reproducción, pausa y posición. Los invitados se sincronizan automáticamente.
- Si el invitado intenta saltar de pista, la sala lo re-sincroniza con el anfitrión.
- El anfitrión puede expulsar a alguien o transferirle el control (menú al pasar el ratón sobre un participante).
- Si el anfitrión se desconecta, la sala se cierra y todos vuelven al inicio.

## Cómo funciona

```
Invitado A ──┐
Invitado B ──┼── WebRTC ──► Anfitrión (host de la sala)
Invitado C ──┘
```

1. **Identidad de sala**: el anfitrión crea un peer PeerJS con el ID `l2g-<ID>`. El código de sala se deriva de ese identificador, por eso compartir el ID es suficiente para encontrarse.
2. **Señalización**: PeerJS Cloud intercambia ofertas/respuestas SDP entre clientes (solo metadatos de conexión, ningún dato de la sala).
3. **Conexión**: una vez establecida la conexión WebRTC, el anfitrión difunde el estado de reproducción (URI de la pista, posición, play/pausa) cada 2 segundos y en cada evento de cambio de canción o de reproducción.
4. **Aplicación del estado**: cada invitado compara la pista actual con la remota. Si coinciden, ajusta posición y estado con tolerancia; si no, reproduce la pista remota con `Spicetify.Player.playUri` y aplica la posición pendiente al llegar el evento `songchange`. Un flag temporal (`applyingUntil`) evita bucles de retroalimentación entre el evento local y el estado remoto.
5. **Chat y eventos**: mensajes de chat, expulsiones, transferencia de anfitrión y saludos viajan por los mismos canales de datos PeerJS.

### Anfitrión y nuevos invitados

Cuando el anfitrión transfiere su rol, envía un mensaje `host-change` a todos. Los invitados existentes se reconectan al nuevo anfitrión, y si alguien intenta unirse con la ruta antigua, el mensaje `redirect` le devuelve al nuevo host. Así la sala sobrevive a la marcha de su creador.

## Estructura del proyecto

```
app/
  index.js            Aplicación completa (lógica P2P + UI React), sin comentarios
  style.css           Estilos del custom app
  manifest.json       Manifest interno de Spicetify (inyección de CSS + subfiles)
  peerjs.bundle.js    PeerJS empaquetado, expuesto como window.Peer
src/
  peerjs-entry.js     Punto de entrada para empaquetar PeerJS con esbuild
assets/
  preview.png         Imagen de previsualización para el Marketplace
install.ps1           Instalador (copia app/ y aplica Spicetify)
manifest.json         Manifest para el Spicetify Marketplace
README.md             Este archivo
LICENSE               MIT
```

### Notas de implementación

- `app/manifest.json` no debe listar `style.css` en `subfiles`: Spicetify concatena los subfiles como JavaScript y produciría un error de sintaxis. El CSS se inyecta automáticamente porque `inject_css` está activo por defecto cuando existe `style.css` en la carpeta.
- El punto de entrada define `function render()` que devuelve el elemento React; el runtime de Spicetify se encarga de montarlo. No se debe usar `ReactDOM.createRoot`.
- El runtime de React es el que incluye Spicetify (`Spicetify.React`); no se importa React de npm.

## Desarrollo

```powershell
npm install
npm run build        reconstruye app/peerjs.bundle.js con esbuild
.\install.ps1        reinstala y aplica en Spotify
```

Para modificar la app, edita `app/index.js` y `app/style.css`, vuelve a ejecutar `.\install.ps1` y reinicia Spotify. No hace falta compilar TypeScript: el custom app es JavaScript puro.

Comprobación de sintaxis rápida:

```powershell
node --check app\index.js
```

## Solución de problemas

| Problema | Solución |
| --- | --- |
| "Something went wrong" al abrir la app | Comprueba `node --check app\index.js` y que `manifest.json` no liste `style.css` en `subfiles`. |
| "No existe ninguna sala con ese ID" | El anfitrión debe tener la sala abierta; el ID es sensible a errores (sin 0/O ni 1/I). |
| "Sin conexión con el servicio de señalización" | Fallo de red hacia PeerJS Cloud. Comprueba tu conexión o un VPN/firewall. |
| Los invitados no se sincronizan | Algunas redes bloquean WebRTC sin candidatos STUN. Prueba sin VPN o con otra red. |
| Tras `spicetify apply` no aparece | Reinicia Spotify por completo (cerrar también de la bandeja). |

## Publicación en el Spicetify Marketplace

Para que aparezca en el Marketplace:

1. El repositorio debe ser **público** en GitHub.
2. Añade el tema `spicetify-apps` al repositorio.
3. La raíz debe contener un `manifest.json` válido con `name`, `description`, `preview` (ruta a la imagen), `readme`, `authors` y `tags` (ya está incluido en este repo).
4. Sigue la guía [Publishing to Marketplace](https://github.com/spicetify/marketplace/wiki/Publishing-to-Marketplace).
5. Ten en cuenta que los custom apps, aunque se listan, se instalan manualmente copiando la carpeta correspondiente a `CustomApps`.

## Licencia

[MIT](LICENSE)
