import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Report from './pages/Report';

// 1. IMPORT THE REAL PAGES HERE
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session'

// Leave these placeholders for a moment until we build them in the next step

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/session" 
          element={
            <PrivateRoute>
              <Session />
            </PrivateRoute>
          } 
        />

        <Route 
        path="/report/:id" 
        element={
          <PrivateRoute>
            <Report />
          </PrivateRoute>
        } 
      />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;