import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProblemsProvider } from './context/ProblemsContext';
import { TermProvider } from './context/TermContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { LearningWorkspace } from './pages/LearningWorkspace';
import { Auth } from './pages/Auth';
import { Unauthorized } from './pages/Unauthorized';
import { Learning } from './pages/Learning';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <ProblemsProvider>
            <TermProvider>
              <Router>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/register" element={<Navigate to="/auth" replace />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  <Route path="*" element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/workspace/:id" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
                        <Route path="/learn/:lectureId/:notebookId" element={<ProtectedRoute><LearningWorkspace /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  } />
                </Routes>
              </Router>
            </TermProvider>
          </ProblemsProvider>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
