import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiLock } from "react-icons/fi";
import SocialLoginButtons from "./SocialLoginButtons";
import { useAuth } from "../context/AuthContext";
import { trackUserAction } from "../utils/analytics";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use only the auth context login function
      await login(email, password);
      trackUserAction.login('email'); // Track successful login
      navigate("/");
    } catch (error) {
      console.error("Login error:", error.response?.data || error);
      alert(error.response?.data?.error || error.response?.data?.message || "Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Left */}
      <div className="w-full md:w-1/2 bg-[#9AC9DE] relative p-6 md:p-10 md:h-full">
        <div className="flex flex-col items-start">
          <img src="/assets/enhanced-Photoroom.png" alt="Notora Logo" className="h-16 md:h-20 mb-1" />
          <p className="text-black-700 text-lg md:text-xl mt-2 font-medium">Simplify Your Study</p>
        </div>
        <img
          src="/assets/loginpage.png"
          alt="Abstract Design"
          className="absolute top-1/2 left-[75%] transform -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-lg hidden lg:block"
        />
      </div>

      {/* Right */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white md:h-full">
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-center mb-6">Welcome Back!</h3>

          <SocialLoginButtons />

          <div className="flex items-center mb-6">
            <hr className="flex-1 border-t border-gray-300" />
            <span className="px-3 text-gray-400">- OR -</span>
            <hr className="flex-1 border-t border-gray-300" />
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 placeholder-gray-500"
            />
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 pr-8 placeholder-gray-500"
              />
              <FiLock className="absolute right-0 bottom-2 text-gray-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9AC9DE] hover:bg-[#8bbacb] text-black font-semibold py-2 rounded-xl mt-4 text-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an Account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
