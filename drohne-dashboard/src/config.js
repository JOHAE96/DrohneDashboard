// VUE_APP_-Präfix ist bei Vue CLI nötig, damit die Variable im Client-Bundle landet.
// Fallback passt zum lokalen Dev-Setup aus backend-api/README.md (npm run dev, Port 3000).
export const apiBaseUrl = process.env.VUE_APP_API_URL || "http://localhost:3000";
