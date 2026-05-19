import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { pool, testConnection } from './config/database.js';
import { initRealtime } from './services/realtime.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import organizationsRoutes from './routes/organizations.routes.js';
import usersRoutes from './routes/users.routes.js';
import visitsRoutes from './routes/visits.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import reasonsRoutes from './routes/reasons.routes.js';
import badgesRoutes from './routes/badges.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import areasRoutes from './routes/areas.routes.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS: lista blanca de orígenes permitidos
const ALLOWED_ORIGINS = [
    // Desarrollo local
    'http://localhost:5181',
    'http://localhost:5173',
    'http://localhost:3000',
    // Producción — agrega aquí tus dominios definitivos
    /\.sslip\.io$/,       // dominios dinámicos Dokploy
    /\.grupomvrd\.com$/,  // dominio oficial GMV
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (REST clients, server-to-server)
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) return callback(null, true);
        callback(new Error(`CORS: origen no permitido — ${origin}`));
    },
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/reasons', reasonsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/areas', areasRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
const start = async () => {
    await testConnection();
    initRealtime(httpServer);
    httpServer.listen(PORT, () => {
        console.log(`🚀 Visitas Hub RD API & Realtime running on port ${PORT}`);
    });
};

start();
