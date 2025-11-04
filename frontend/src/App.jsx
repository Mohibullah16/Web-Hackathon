import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import Login from './components/Login';
import Register from './components/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Forum from './pages/Forum';
import PostDetail from './pages/PostDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<FarmerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:postId" element={<PostDetail />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
