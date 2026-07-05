import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotesPage from "./pages/NotesPage";
import ChatPage from "./pages/ChatPage";
import GoogleCallback from "./pages/GoogleCallback";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from './pages/AdminDashboard';
import UploadPage from "./pages/UploadPage";
import PremiumPage from "./pages/PremiumPage";
import OCRPage from "./pages/OCRPage";
import GoogleAnalytics from "./components/GoogleAnalytics";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import CancellationAndRefund from "./pages/CancellationAndRefund";
import ShippingAndDelivery from "./pages/ShippingAndDelivery";
import ContactUs from "./pages/ContactUs";
// import PremiumPage from "./pages/PremiumPage";
// import UploadPage from "./pages/UploadPage";

function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/signup", "/auth/google/callback"];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      <GoogleAnalytics />
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/ocr" element={<OCRPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/cancellation-and-refund" element={<CancellationAndRefund />} />
        <Route path="/shipping-and-delivery" element={<ShippingAndDelivery />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* <Route path="/premium" element={<PremiumPage />} /> */}
        {/* <Route path="/upload" element={<UploadPage />} /> */}
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

// import React from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import NavBar from "./components/Navbar";
// import HomePage from "./pages/HomePage";
// // import NotesPage from "./pages/NotesPage";
// // import UploadPage from "./pages/UploadPage";
// // import PremiumPage from "./pages/PremiumPage";
// import LoginPage from "./pages/LoginPage";
// import SignupPage from "./pages/SignupPage";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <NavBar />
//       <Routes>
//         <Route path="/" element={<HomePage />} />
//         {/* <Route path="/notes" element={<NotesPage />} /> */}
//         {/* <Route path="/upload" element={<UploadPage />} /> */}
//         {/* <Route path="/premium" element={<PremiumPage />} /> */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />

//       </Routes>
//     </BrowserRouter>
//   );
// }
