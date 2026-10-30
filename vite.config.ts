import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? "/UDLMS/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      // Spring Boot Backend API
      "/api/instruments": "http://localhost:8081",
      "/api/verifications": "http://localhost:8081",
      "/api/verify": "http://localhost:8081",
      "/api/certificates": "http://localhost:8081",
      // Python DS OCR API
      "/api/ocr": "http://localhost:8000",
    },
  },
})

