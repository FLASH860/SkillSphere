import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PostGig from './pages/PostGig';
import EditGig from './pages/EditGig';
import BrowseGigs from './pages/BrowseGigs';
import GigDetail from './pages/GigDetail';
import GigProposals from './pages/GigProposals';
import MyProposals from './pages/MyProposals';
import MyBookings from './pages/MyBookings';
import ChatPage from './pages/ChatPage';
import PaymentResult from './pages/PaymentResult';
import EditProfile from './pages/EditProfile';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

function HomeRedirect() {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'client') return <Navigate to="/client" />;
  if (user.role === 'freelancer') return <Navigate to="/freelancer" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/client"
        element={
          <ProtectedRoute roles={['client']}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/post-gig"
        element={
          <ProtectedRoute roles={['client']}>
            <PostGig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/gigs/:id/edit"
        element={
          <ProtectedRoute roles={['client']}>
            <EditGig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer"
        element={
          <ProtectedRoute roles={['freelancer']}>
            <FreelancerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/proposals"
        element={
          <ProtectedRoute roles={['freelancer']}>
            <MyProposals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelancer/bookings"
        element={
          <ProtectedRoute roles={['freelancer']}>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gigs"
        element={
          <ProtectedRoute roles={['freelancer']}>
            <BrowseGigs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gigs/:id"
        element={
          <ProtectedRoute roles={['client', 'freelancer']}>
            <GigDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/gigs/:gigId/proposals"
        element={
          <ProtectedRoute roles={['client']}>
            <GigProposals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute roles={['client', 'freelancer', 'admin']}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-result"
        element={
          <ProtectedRoute roles={['client', 'freelancer', 'admin']}>
            <PaymentResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['client', 'freelancer', 'admin']}>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


