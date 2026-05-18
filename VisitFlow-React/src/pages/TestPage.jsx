import React from 'react';

function TestPage() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#1e293b',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ React Funciona</h1>
                <p style={{ fontSize: '1.5rem', color: '#94a3b8' }}>VisitFlow está cargando correctamente</p>
                <p style={{ marginTop: '2rem', fontSize: '1rem', color: '#64748b' }}>
                    Si ves este mensaje, el problema está en el AuthContext o la API
                </p>
            </div>
        </div>
    );
}

export default TestPage;
