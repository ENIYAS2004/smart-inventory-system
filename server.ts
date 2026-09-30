import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { connectDB } from './src/backend/config/db';
import { createExpressApp } from './src/backend/app';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    // 1. Connect to MongoDB (MongoDB Atlas, local mongod, or automatic in-memory fallback)
    await connectDB();

    // 2. Initialize Express App with all REST APIs
    const app = createExpressApp();
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const isProduction = process.env.NODE_ENV === 'production';

    // 3. Mount Frontend
    if (isProduction) {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(` SMART INVENTORY & ASSET MANAGEMENT SYSTEM (MERN)`);
      console.log(` Server running on: http://localhost:${PORT}`);
      console.log(` REST API available under: /api/*`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
