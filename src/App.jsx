import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProblemsProvider } from './context/ProblemsContext';
import { TermProvider, useTerm, normalizeCourse, resolveValidTool } from './context/TermContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { LearningWorkspace } from './pages/LearningWorkspace';
import { Auth } from './pages/Auth';
import { Unauthorized } from './pages/Unauthorized';
import { Learning } from './pages/Learning';
import './index.css';

function TermRouteRedirect({ term, defaultTool }) {
  const { activeCourse, setActiveCourse, setActiveTerm, activeTool, setActiveTool } = useTerm();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const targetTerm = term === 'last' ? 'final' : term;
    const params = new URLSearchParams(location.search);
    const targetCourse = normalizeCourse(params.get('course')) || activeCourse || 'programming';
    const requestedTool = params.get('tool') || defaultTool || activeTool || 'tests';
    const validTool = resolveValidTool(targetTerm, requestedTool);

    setActiveCourse(targetCourse);
    setActiveTerm(targetTerm);
    setActiveTool(validTool, targetTerm);

    const nextParams = new URLSearchParams();
    nextParams.set('course', targetCourse);
    nextParams.set('term', targetTerm);
    nextParams.set('tool', validTool);

    navigate(`/?${nextParams.toString()}`, { replace: true });
  }, [term, defaultTool, location.search, activeCourse, setActiveCourse, setActiveTerm, setActiveTool, activeTool, navigate]);

  return null;
}

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

                  <Route
                    path="*"
                    element={
                      <Layout>
                        <Routes>
                          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/mid-term/*" element={<TermRouteRedirect term="mid" />} />
                          <Route path="/final-term/learn/:lectureId/:notebookId" element={<ProtectedRoute><LearningWorkspace /></ProtectedRoute>} />
                          <Route path="/last-term/learn/:lectureId/:notebookId" element={<ProtectedRoute><LearningWorkspace /></ProtectedRoute>} />
                          <Route path="/final-term/*" element={<TermRouteRedirect term="final" />} />
                          <Route path="/last-term/*" element={<TermRouteRedirect term="final" />} />
                          <Route path="/workspace/:id" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
                          <Route path="/learn/:lectureId/:notebookId" element={<ProtectedRoute><LearningWorkspace /></ProtectedRoute>} />
                          <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Layout>
                    }
                  />
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
