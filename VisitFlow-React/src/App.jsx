import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VisitsList from './pages/VisitsList';
import Companies from './pages/Companies';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import VisitReasons from './pages/VisitReasons';
import Badges from './pages/Badges';
import UserManagement from './pages/UserManagement';
import OrganizationManagement from './pages/OrganizationManagement';
import AreasManagement from './pages/AreasManagement';
import SecurityPanel from './pages/SecurityPanel';
import VisitorTracking from './pages/VisitorTracking';
import About from './pages/About';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SplashScreen from './components/SplashScreen';
// import TestPage from './pages/TestPage'; // Solo para dev/debug

function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ToastProvider>
    <ConfirmProvider>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute allowedRoles={['administrador', 'recepcion', 'seguridad']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/seguridad" element={
            <ProtectedRoute allowedRoles={['administrador', 'seguridad', 'punto_de_control']}>
              <SecurityPanel />
            </ProtectedRoute>
          } />

          <Route path="/tracking" element={
            <ProtectedRoute allowedRoles={['administrador', 'seguridad', 'superadmin']}>
              <VisitorTracking />
            </ProtectedRoute>
          } />

          <Route path="/listado" element={
            <ProtectedRoute allowedRoles={['administrador', 'recepcion', 'seguridad']}>
              <VisitsList />
            </ProtectedRoute>
          } />

          <Route path="/motivos" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <VisitReasons />
            </ProtectedRoute>
          } />

          <Route path="/areas" element={
            <ProtectedRoute allowedRoles={['administrador', 'seguridad']}>
              <AreasManagement />
            </ProtectedRoute>
          } />

          <Route path="/empresas" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Companies />
            </ProtectedRoute>
          } />

          <Route path="/empleados" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Employees />
            </ProtectedRoute>
          } />

          <Route path="/carnets" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <Badges />
            </ProtectedRoute>
          } />

          <Route path="/reportes" element={
            <ProtectedRoute allowedRoles={['administrador', 'recepcion']}>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['administrador', 'seguridad', 'superadmin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/organizaciones" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <OrganizationManagement />
            </ProtectedRoute>
          } />

          <Route path="/acerca" element={
            <ProtectedRoute allowedRoles={['administrador', 'recepcion', 'seguridad', 'superadmin', 'punto_de_control']}>
              <About />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
    </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
