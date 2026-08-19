import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { CourtsPage } from './pages/CourtsPage';
import { CourtDetailPage } from './pages/CourtDetailPage';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/courts/:id" element={<CourtDetailPage />} />
            <Route path="/book/:courtId" element={<BookingPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
