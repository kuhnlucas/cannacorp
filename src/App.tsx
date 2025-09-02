import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
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
                  <Route path="monitoring" element={
                    <ProtectedRoute>
                      <Monitoring />
                    </ProtectedRoute>
                  } />
                  <Route path="analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;