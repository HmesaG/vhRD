import { Server } from 'socket.io';
import pg from 'pg';

let io;

export const initRealtime = (httpServer) => {
    // 1. Iniciar servidor de WebSockets
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Cliente Socket.IO conectado: ${socket.id}`);
        
        socket.on('disconnect', () => {
            console.log(`🔌 Cliente desconectado: ${socket.id}`);
        });
    });

    // 2. Conexión dedicada de PostgreSQL para escuchar eventos
    const client = new pg.Client({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:zX9!nQ2pL_7tR4vB@31.97.100.82:8432/visitflow'
    });

    client.connect()
        .then(() => {
            console.log('📡 Listener de PostgreSQL conectado para tiempo real');
            // Nos suscribimos al canal de notificaciones que creamos en SQL
            return client.query('LISTEN db_notifications');
        })
        .catch(err => console.error('❌ Error conectando listener:', err));

    // 3. Cuando PostgreSQL nos notifique un cambio en una tabla, lo empujamos vía WebSockets
    client.on('notification', (msg) => {
        if (msg.channel === 'db_notifications') {
            try {
                const payload = JSON.parse(msg.payload);
                // payload contendrá: { table: 'visits', action: 'INSERT', data: {...} }
                io.emit('db_change', payload);
            } catch (err) {
                console.error('Error parseando notificación de PG:', err);
            }
        }
    });

    client.on('error', (err) => {
        console.error('Error en el listener de PG:', err);
    });
};

export const getIO = () => io;
