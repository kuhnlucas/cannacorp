import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TenantProvider } from './contexts/TenantContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Labs from './pages/Labs';
import Genetics from './pages/Genetics';
import GeneticsDetail from './pages/GeneticsDetail';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import Monitoring from './pages/Monitoring';
import Analytics from './pages/Analytics';
import Problems from './pages/Problems';
import Alerts from './pages/Alerts';
import QuickOperation from './pages/Operations/QuickOperation';
import OperationLogs from './pages/Operations/OperationLogs';
import OperationPlan from './pages/Operations/OperationPlan';
import Guides from './pages/Resources/Guides';
import Growshops from './pages/Resources/Growshops';
import Sensors from './pages/Sensors';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TenantProvider>
              <DataProvider>
                <Router>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                    <Routes>
                    <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Dashboard */}
                    <Route path="dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* Gestión */}
                    <Route path="labs" element={
                      <ProtectedRoute>
                        <Labs />
                      </ProtectedRoute>
                    } />
                    <Route path="genetics" element={
                      <ProtectedRoute>
                        <Genetics />
                      </ProtectedRoute>
                    } />
                    <Route path="genetics/:id" element={
                      <ProtectedRoute>
                        <GeneticsDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="batches" element={
                      <ProtectedRoute>
                        <Batches />
                      </ProtectedRoute>
                    } />
                    <Route path="batches/:id" element={
                      <ProtectedRoute>
                        <BatchDetail />
                      </ProtectedRoute>
                    } />
                    
                    {/* Operaciones */}
                    <Route path="ops/new" element={
                      <ProtectedRoute>
                        <QuickOperation />
                      </ProtectedRoute>
                    } />
                    <Route path="ops/logs" element={
                      <ProtectedRoute>
                        <OperationLogs />
                      </ProtectedRoute>
                    } />
                    <Route path="ops/plan" element={
                      <ProtectedRoute>
                        <OperationPlan />
                      </ProtectedRoute>
                    } />
                    
                    {/* Monitoreo */}
                    <Route path="monitoring" element={
                      <ProtectedRoute>
                        <Monitoring />
                      </ProtectedRoute>
                    } />
                    <Route path="sensors" element={
                      <ProtectedRoute>
                        <Sensors />
                      </ProtectedRoute>
                    } />
                    <Route path="pulsegrow" element={
                      <ProtectedRoute>
                        <Sensors />
                      </ProtectedRoute>
                    } />
                    <Route path="alerts" element={
                      <ProtectedRoute>
                        <Alerts />
                      </ProtectedRoute>
                    } />
                    
                    {/* Analítica */}
                    <Route path="analytics" element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    } />
                    <Route path="problems" element={
                      <ProtectedRoute>
                        <Problems />
                      </ProtectedRoute>
                    } />
                    
                    {/* Recursos */}
                    <Route path="resources/guides" element={
                      <ProtectedRoute>
                        <Guides />
                      </ProtectedRoute>
                    } />
                    <Route path="resources/growshops" element={
                      <ProtectedRoute>
                        <Growshops />
                      </ProtectedRoute>
                    } />
                  </Route>
                </Routes>
              </div>
            </Router>
          </DataProvider>
        </TenantProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
  </ErrorBoundary>
  );
}

export default App;