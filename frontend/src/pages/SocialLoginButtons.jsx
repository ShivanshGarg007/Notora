import React from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SocialLoginButtons = () => {
  return (
    <div className="flex mb-6 space-x-3 flex-col items-center">
      <p className="text-sm font-medium text-gray-600 mb-4">Sign in with</p>
      <div className="flex space-x-5">
        <a
          href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="p-3 rounded-full hover:bg-[#e6f3f9] hover:shadow-[0_0_20px_5px_rgba(156,201,222,0.7)] transition duration-300 ease-in-out"
        >
          <FcGoogle className="text-2xl" />
        </a>
        <button className="p-3 rounded-full hover:bg-[#e6f0fb] hover:shadow-[0_0_20px_5px_rgba(24,119,242,0.7)] transition duration-300 ease-in-out">
          <FaFacebookF className="text-2xl text-[#1877F2]" />
        </button>
        <button className="p-3 rounded-full hover:bg-[#f1f1f1] hover:shadow-[0_0_20px_5px_rgba(0,0,0,0.3)] transition duration-300 ease-in-out">
          <FaGithub className="text-2xl text-black" />
        </button>
        <button className="p-3 rounded-full hover:bg-[#e8f4fc] hover:shadow-[0_0_20px_5px_rgba(29,155,240,0.7)] transition duration-300 ease-in-out">
          <FaXTwitter className="text-2xl text-black" />
        </button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
