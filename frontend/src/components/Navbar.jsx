import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  BookOpen,
  Home,
  MessageCircle,
  Crown,
  User,
  Menu,
  X,
  LogOut,
  Shield,
  Scan,
  ChevronDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { trackUserAction } from "../utils/analytics";
import PremiumBadge from "./PremiumBadge";

const getNavigation = (isAdmin) => {
  const baseNav = [
    { name: "Home", href: "/", icon: Home },
    { name: "Notes", href: "/notes", icon: BookOpen },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "OCR", href: "/ocr", icon: Scan },
    { name: "Premium", href: "/premium", icon: Crown },
  ];

  if (isAdmin) {
    baseNav.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  return baseNav;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = getNavigation(user?.role === 'admin');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      // Use the logout function from auth context
      logout();
      trackUserAction.logout(); // Track logout event
      
      // Close dropdown
      setDropdownOpen(false);
      
      // Navigate to login
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Helper to get initials from user name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-[#e2e8f0] shadow-md rounded-b-2xl transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ background: "linear-gradient(to bottom right, #9AC9DE, #9AC9DE99)" }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Notora</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-[#bbd9e8] text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle - Commented out
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center space-x-2"
                >
                  {/* User Initials Avatar */}
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c471f5] to-[#fa71cd] text-white flex items-center justify-center font-bold text-lg shadow border-2 border-white">
                    {getInitials(user.name)}
                  </span>
                  {user.isPremium && <PremiumBadge className="ml-2" />}
                </Button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl animate-fade-in z-50">
                    <div className="px-4 py-2 border-b font-semibold text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>{user.name}</span>
                        {/* {user.isPremium && <PremiumBadge />} */}
                      </div>
                      {user.role === 'admin' && (
                        <span className="text-xs text-blue-600">(Admin)</span>
                      )}
                    </div>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    {/* Legal & Contact Links */}
                    <div className="border-t mt-1">
                      <Link to="/privacy-policy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Privacy Policy</Link>
                      <Link to="/terms-and-conditions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Terms & Conditions</Link>
                      <Link to="/cancellation-and-refund" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Cancellation & Refund</Link>
                      <Link to="/shipping-and-delivery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Shipping & Delivery</Link>
                      <Link to="/contact-us" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Contact Us</Link>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <Link to="/login">
                  <Button variant="outline" className="space-x-2" onClick={() => setDropdownOpen((prev) => !prev)}>
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl animate-fade-in z-50">
                    {/* Legal & Contact Links for not logged in users */}
                    <Link to="/privacy-policy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Privacy Policy</Link>
                    <Link to="/terms-and-conditions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Terms & Conditions</Link>
                    <Link to="/cancellation-and-refund" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Cancellation & Refund</Link>
                    <Link to="/shipping-and-delivery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Shipping & Delivery</Link>
                    <Link to="/contact-us" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>Contact Us</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-[#bbd9e8] text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            {/* Removed Info links from mobile menu */}
          </div>
        </div>
      )}
    </nav>
  );
}