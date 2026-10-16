# Modelos de reconocimiento facial

Pesos del modelo usados por `@vladmandic/face-api` (research R1, R13). Se sirven localmente desde
esta carpeta para que el reconocimiento funcione sin conexión a internet.

Archivos requeridos:

| Modelo | Archivos | Uso |
|--------|----------|-----|
| TinyFaceDetector | `tiny_face_detector_model-weights_manifest.json`, `tiny_face_detector_model.bin` | Detección del rostro |
| FaceLandmark68 | `face_landmark_68_model-weights_manifest.json`, `face_landmark_68_model.bin` | Puntos faciales (alineación) |
| FaceRecognition | `face_recognition_model-weights_manifest.json`, `face_recognition_model.bin` | Descriptor facial de 128 dimensiones |

Estos archivos se copian desde `frontend/node_modules/@vladmandic/face-api/model/` después de
`npm install` en `frontend/`. Si se actualiza la librería, vuelva a copiarlos para mantener la
misma versión del modelo.
