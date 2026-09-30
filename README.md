# Olimpiada de Gaming UPTPC 2026 - Plataforma Oficial de Inscripción

Plataforma web oficial para la inscripción de participantes en la **Olimpiada de Gaming UPTPC 2026** (Consolas PlayStation 5: *FIFA 2026* y *Mortal Kombat*), evento organizado por la **Unidad de Ciencia y Tecnología de la Universidad Politécnica Territorial de Puerto Cabello**.

Desarrollada para ser desplegada en **GitHub Pages** y conectada con **Google Sheets** y **Google Drive** a través de **Google Apps Script**.

---

## 🎮 Características de la Plataforma

- **Branding Cyberpunk Neón**: Estilo inspirado en el afiche oficial con paleta oscura, resplandor neón cian (`#00f3ff`) y magenta (`#ff007f`), tipografías futuristas (*Orbitron*, *Chakra Petch*, *Rajdhani*) y logos institucionales oficiales (`LOGO_UPTPC.png` y `CYT.png`).
- **Conversión de Moneda en Tiempo Real**: Conectado a la API oficial de [DolarAPI](https://ve.dolarapi.com/v1/dolares/oficial) para calcular automáticamente el monto en Bolívares (Bs.) tanto para \$5 (un juego) como para \$10 (ambos juegos).
- **Modal Dinámico de Inscripción**:
  - Cédula de identidad (V/E)
  - Nombre completo
  - Correo electrónico
  - Teléfono WhatsApp
  - Game Tag (apodo gamer)
  - Catálogo interactivo de **10 avatares gaming** en SVG
  - Selector de nivel de juego del **1 al 10** con rango gamer
  - Selector con los **30 bancos de Venezuela**
  - Número de transferencia, fecha y comprobante (capture) con drag & drop y vista previa
- **Listas en Vivo en el Index**: Muestra a los jugadores registrados en *FIFA 2026* y *Mortal Kombat*. Si un participante se inscribe en ambos juegos, se refleja automáticamente en ambas listas.
- **Datos de Transferencia Bancaria**:
  - **Beneficiario**: Universidad Politécnica Territorial de Puerto Cabello
  - **RIF**: G-20005608-8
  - **Banco**: Banco de Venezuela
  - **Cuenta Corriente**: 01020317120000201359
  - Botón de copiado rápido con confirmación visual.

---

## 📂 Estructura del Proyecto

```text
├── index.html              # Página principal (Hero, Precios, Listas, Modal, Footer)
├── css/
│   ├── style.css           # Estilos Neón Cyberpunk, efectos de luz, grilla y responsive
│   └── modal.css           # Estilos del modal gamer, dropzone y ticket de éxito
├── js/
│   ├── app.js              # Controlador principal y lógica de la interfaz
│   ├── api.js              # Integración con DolarAPI y Google Apps Script
│   ├── banks.js            # Catálogo de los 30 bancos de Venezuela
│   └── avatars.js          # Catálogo de 10 avatares gaming en SVG
├── img/
│   ├── LOGO_UPTPC.png      # Logo de la Universidad
│   ├── CYT.png             # Logo de Ciencia y Tecnología
│   ├── favicon.svg         # Favicon del sitio
│   └── folleto.jpg         # Afiche oficial de referencia
├── google.gs               # Código listo para Google Apps Script (Sheets + Drive)
└── README.md               # Documentación y guía de despliegue
```

---

## ⚙️ Configuración del Backend en Google Apps Script

El archivo [`google.gs`](./google.gs) contiene todo el código necesario para gestionar la base de datos en Google Sheets y almacenar los captures en Google Drive:

1. Crea o abre tu hoja de cálculo en **Google Sheets** (ej: *"Olimpiada Gaming UPTPC - Base de Datos"*).
2. En el menú superior de Sheets, ve a: **Extensiones > Apps Script**.
3. Borra el código existente y pega todo el contenido de [`google.gs`](./google.gs).
4. Verifica que la variable `DRIVE_FOLDER_ID` coincida con tu carpeta de Drive:
   ```javascript
   var DRIVE_FOLDER_ID = '16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF';
   ```
5. En la barra superior de Apps Script, selecciona la función **`setupSheets`** y haz clic en **Ejecutar**. Esto creará automáticamente las hojas con sus encabezados:
   - `usuarios`: `id`, `icono`, `cedula`, `nombre`, `correo`, `telefono`, `game_tag`, `nivel`
   - `pagos`: `id`, `id_juego`, `id_usuario`, `numero_pago`, `banco_origen`, `fecha`, `capture`
   - `juegos`: `id`, `nombre`, `valor`
6. Haz clic en el botón azul **Implementar > Nueva implementación**:
   - **Tipo**: Aplicación web
   - **Descripción**: *API Olimpiada Gaming UPTPC*
   - **Ejecutar como**: *Yo (tu correo)*
   - **Quién tiene acceso**: *Cualquier usuario* (importante para permitir inscripciones públicas)
7. Haz clic en **Implementar**, autoriza los permisos de Google Drive y Sheets, y copia la URL generada.
8. Si la URL coincide con la actual (`https://script.google.com/macros/s/AKfycbwLvCsBNgKJC0TxP7owwUX-tOuLKhB9qkJTO06QOJ8uMacmnj3AnykXOIaMhwGiqSJ6/exec`), ya está todo enlazado en `js/api.js`.

---

## 🚀 Despliegue en GitHub Pages

1. Sube los cambios a tu repositorio en GitHub:
   ```bash
   git add .
   git commit -m "feat: plataforma de inscripciones olimpiada de gaming UPTPC"
   git push origin main
   ```
2. En tu repositorio de GitHub, ve a **Settings** (Configuración) > **Pages**.
3. En la sección **Build and deployment**:
   - **Source**: *Deploy from a branch*
   - **Branch**: *main* / *(root)*
4. Haz clic en **Save**. En 1 o 2 minutos tu sitio estará en línea en:
   `https://jesymca.github.io/gaming/`

---

## 🏛️ Créditos y Organización

- **Organizador**: Unidad de Ciencia y Tecnología de la UPTPC
- **Institución**: Universidad Politécnica Territorial de Puerto Cabello
- **Aliados**:
  - Ministerio del Poder Popular para la Educación Universitaria
  - Ministerio del Poder Popular para Ciencia y Tecnología
  - Fundacite Carabobo
