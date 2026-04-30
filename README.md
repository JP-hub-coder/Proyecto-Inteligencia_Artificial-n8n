# 📋 Sistema de Justificación de Inasistencias con IA y n8n

> Proyecto académico que automatiza el proceso de justificación de inasistencias estudiantiles usando inteligencia artificial, n8n como motor de automatización, Google Sheets como base de datos y Telegram como canal de comunicación.

---

## 📊 Hoja de Registro (Google Sheets)

Los datos de todas las solicitudes se almacenan y pueden consultarse en la siguiente hoja de cálculo:

🔗 **[Ver hoja de registro en Google Sheets](https://docs.google.com/spreadsheets/d/14zpymnSklp0PRp-PW7VNua7G2iFor1ulIK_p66X_-FY/edit?usp=sharing)**

---

## 📁 Estructura del Proyecto

```
Proyecto-Inteligencia_Artificial-n8n-main/
│
├── index.html                              # Formulario web de justificación
├── script.js                               # Lógica del frontend y conexión al webhook
├── styles.css                              # Estilos visuales del formulario
│
└── JSON/
    ├── Justificación_inasistencias.json    # Flujo principal de n8n (recepción + IA + notificaciones)
    └── Revisión_solicitud_Telegram.json    # Flujo de consulta de solicitudes vía Telegram
```

---

## 🧠 ¿Cómo funciona?

El sistema tiene **dos flujos de automatización en n8n** que trabajan juntos:

### Flujo 1 — Justificación de Inasistencias

Este es el flujo principal. Se activa cuando un estudiante envía el formulario web.

```
[Formulario Web]
      ↓
[Webhook n8n] — Recibe los datos del formulario + archivo adjunto
      ↓
[Code JavaScript] — Parsea y estructura los campos recibidos
      ↓
[HTTP Request] — Sube el archivo adjunto (soporte) a almacenamiento externo
      ↓
[AI Agent + OpenRouter + GPT] — Analiza la justificación con IA
      ↓
[Structured Output Parser] — Extrae: validez (válida / inválida / dudosa) + razón
      ↓
[Switch] — Enruta según el resultado de la IA
      ├── ✅ Válida → Guarda en Sheets → Notifica al estudiante por Telegram → Confirma
      ├── ❌ Inválida → Guarda en Sheets → Envía mensaje de negación por Telegram
      └── 🤔 Dudosa → Guarda en Sheets → Notifica al admin para revisión manual
      ↓
[Respond to Webhook] — Responde al formulario (éxito o error)
```

### Flujo 2 — Revisión de Solicitudes por Telegram

Permite que los estudiantes consulten el estado de sus solicitudes directamente desde Telegram.

```
[Telegram Trigger] — Detecta mensajes entrantes
      ↓
[Edit Fields] — Prepara los parámetros de búsqueda
      ↓
[Google Sheets] — Busca por ID de solicitud o por ID de estudiante
      ↓
[If] — Verifica si se encontró o no la solicitud
      ├── Encontrada → Arma y envía mensaje con el estado de la solicitud
      └── No encontrada → Envía mensaje informando que no existe
```

---

## 🛠️ Tecnologías Usadas

| Tecnología | Rol en el proyecto |
|---|---|
| **HTML / CSS / JavaScript** | Formulario web del estudiante |
| **n8n** | Motor de automatización de flujos |
| **OpenRouter (LLM)** | Evaluación inteligente de justificaciones vía IA |
| **Google Sheets** | Base de datos de solicitudes |
| **Telegram Bot** | Notificaciones y consultas de estado |
| **Webhook** | Punto de entrada de datos desde el formulario |

---

## 🚀 Cómo Configurar y Ejecutar

### Requisitos previos

- Cuenta en [n8n.io](https://n8n.io) (cloud o self-hosted)
- Bot de Telegram creado con [@BotFather](https://t.me/BotFather)
- Cuenta en [OpenRouter](https://openrouter.ai) con acceso a un modelo LLM
- Google Sheets habilitado con credenciales OAuth en n8n
- Servidor o servicio de hosting para el formulario HTML (puede ser GitHub Pages, Netlify, etc.)

### Paso 1 — Importar los flujos en n8n

1. Abre tu instancia de n8n.
2. Ve a **Workflows → Import from File**.
3. Importa primero `JSON/Justificación_inasistencias.json`.
4. Luego importa `JSON/Revisión_solicitud_Telegram.json`.

### Paso 2 — Configurar credenciales en n8n

Dentro de n8n, configura las siguientes credenciales:

- **Google Sheets OAuth2** — para leer y escribir en la hoja de cálculo.
- **Telegram Bot API** — token del bot creado con BotFather.
- **OpenRouter API Key** — para el nodo de IA `OpenRouter Chat Model`.

### Paso 3 — Activar el Webhook y actualizar la URL en el frontend

1. Activa el flujo `Justificación_inasistencias` en n8n.
2. Copia la URL del nodo **"Recibir Formulario"** (Webhook).
3. Abre el archivo `script.js` y reemplaza la constante `N8N_WEBHOOK_URL`:

```javascript
const N8N_WEBHOOK_URL = 'https://TU-INSTANCIA.n8n.cloud/webhook/justificacion';
```

> **Nota:** Si usas ngrok para pruebas locales, también está comentada la línea alternativa en `script.js`.

### Paso 4 — Conectar Google Sheets

1. Abre la hoja de cálculo del proyecto (enlace arriba).
2. En n8n, conecta los nodos **"Enviar al Sheets"** al ID de tu hoja.
3. Asegúrate de que los encabezados de columnas coincidan con los campos del formulario:
   - `ID_estudiante`, `Correo`, `Nombre`, `Teléfono`, `Curso`, `Motivo_inasistencia`, `fecha_inicio`, `fecha_fin`, `rango_fechas`, `descripcion`, `timestamp`, `ID_solicitud`, `Url_imagen`

### Paso 5 — Desplegar el formulario web

Sube los archivos `index.html`, `script.js` y `styles.css` a cualquier hosting estático. Por ejemplo:

```bash
# Con GitHub Pages: sube los archivos al repositorio y activa Pages en Settings
# Con Netlify: arrastra la carpeta al panel de Netlify
```

---

## 📝 Campos del Formulario

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| Nombre completo | Texto | ✅ | Nombre del estudiante |
| ID / Código estudiantil | Texto | ✅ | Identificador único del estudiante |
| Correo institucional | Email | ✅ | Correo de la institución |
| Teléfono de contacto | Teléfono | ✅ | Número de contacto |
| Curso / Asignatura | Selector | ✅ | Grupo (C3, C4, D1, D2, D3, J1, K4, Z1, Z2) |
| Fecha de inicio | Fecha | ✅ | Inicio de la ausencia |
| Fecha de fin | Fecha | ❌ | Fin de la ausencia (si aplica) |
| Categoría del motivo | Radio | ✅ | Salud, Familiar, Académico, Laboral, Transporte, Otro |
| Descripción detallada | Texto largo | ✅ | Mínimo 20 caracteres, máximo 500 |
| Documento de soporte | Archivo | ✅ | PDF, JPG o PNG — máx. 5 MB |

---

## 🤖 Lógica de IA

El nodo **AI Agent** analiza la justificación recibida y devuelve una clasificación estructurada:

```json
{
  "validez": "valida" | "invalida" | "dudosa",
  "razon": "Texto explicando el resultado del análisis"
}
```

- **`valida`** → Se registra y se notifica aprobación al estudiante.
- **`invalida`** → Se registra y se envía mensaje de rechazo al estudiante.
- **`dudosa`** → Se registra y se escala al administrador para revisión manual.

---

## ✉️ Notificaciones por Telegram

El sistema envía mensajes automáticos a través del bot de Telegram en los siguientes momentos:

- Cuando una solicitud es **aprobada** → mensaje de confirmación al estudiante.
- Cuando una solicitud es **rechazada** → mensaje de negación con la razón.
- Cuando una solicitud es **dudosa** → alerta al administrador para revisión.
- Cuando el estudiante consulta su solicitud → respuesta con la información registrada.

---

## 👨‍💻 Autor

Proyecto desarrollado como parte del curso de **Inteligencia Artificial** — Por **Juan Pablo Beltrán**.
