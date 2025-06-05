import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiLock } from "react-icons/fi";
import SocialLoginButtons from "./SocialLoginButtons";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting signup with:', { name, email });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      
      console.log('Signup response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      alert("Signup successful!");
      navigate("/");
    } catch (error) {
      console.error('Signup error:', error.response?.data);
      alert(error.response?.data?.error || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Left Section */}
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

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white md:h-full">
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-center mb-6">Create an Account</h3>

          <SocialLoginButtons />

          <div className="flex items-center mb-6">
            <hr className="flex-1 border-t border-gray-300" />
            <span className="px-3 text-gray-400">- OR -</span>
            <hr className="flex-1 border-t border-gray-300" />
          </div>

          <form className="space-y-6" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 placeholder-gray-500"
            />
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
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an Account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;




// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FcGoogle } from "react-icons/fc";
// import { FaFacebookF, FaGithub } from "react-icons/fa";
// import { FiLock } from "react-icons/fi";
// import { FaXTwitter } from "react-icons/fa6";
// import axios from "axios";

// const SignupPage = () => {
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/signup", {
//         name: fullName,
//         email,
//         password,
//       });
//       alert("Signup successful!");
//       navigate("/login");
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Signup failed.");
//     }
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen overflow-hidden">

//       {/* Left Side */}
//       <div className="w-full md:w-1/2 bg-[#9AC9DE] relative p-6 md:p-10 md:h-full">
//         <div className="flex flex-col items-start">
//           <img
//             src="/assets/enhanced-Photoroom.png"
//             alt="Notora Logo"
//             className="h-16 md:h-20 mb-1"
//           />
//           <p className="text-black-700 text-lg md:text-xl mt-2 font-medium">
//             Simplify Your Study
//           </p>
//         </div>
//         <img
//           src="/assets/loginpage.png"
//           alt="Abstract Design"
//           className="absolute top-1/2 left-[75%] transform -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-lg hidden lg:block"
//         />
//       </div>

//       {/* Right Side */}
//       <div className="w-full md:w-1/2 flex items-center justify-center bg-white rounded-tl-lg rounded-bl-lg md:h-full">
//         <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-200">
//           <h3 className="text-2xl font-bold text-center mb-6">
//             Create Account
//           </h3>

//           {/* Social Buttons */}
//           <div className="flex mb-6 space-x-3 flex-col items-center">
//             <p className="text-sm font-medium text-gray-600 mb-4">Signup with</p>


//             <div className="flex space-x-5">
//               <a href="http://localhost:5000/api/auth/google">
//                 <button
//                   className="p-3 rounded-full hover:bg-[#e6f3f9] hover:shadow-[0_0_20px_5px_rgba(156,201,222,0.7)] transition duration-300 ease-in-out"
//                   // title="Login with Google"
//                 >
//                   <FcGoogle className="text-2xl" />
//                 </button>
//               </a>



//               <button className="p-3 rounded-full hover:bg-[#e6f0fb] hover:shadow-[0_0_20px_5px_rgba(24,119,242,0.7)] transition duration-300 ease-in-out">
//                 <FaFacebookF className="text-2xl text-[#1877F2]" />
//               </button>
//               <button className="p-3 rounded-full hover:bg-[#f1f1f1] hover:shadow-[0_0_20px_5px_rgba(0,0,0,0.3)] transition duration-300 ease-in-out">
//                 <FaGithub className="text-2xl text-black" />
//               </button>
//               <button className="p-3 rounded-full hover:bg-[#e8f4fc] hover:shadow-[0_0_20px_5px_rgba(29,155,240,0.7)] transition duration-300 ease-in-out">
//                 <FaXTwitter className="text-2xl text-black" />
//               </button>
//             </div>
//           </div>

//           {/* Separator */}
//           <div className="flex items-center mb-6">
//             <hr className="flex-1 border-t border-gray-300" />
//             <span className="px-3 text-gray-400">- OR -</span>
//             <hr className="flex-1 border-t border-gray-300" />
//           </div>

//           {/* Signup Form */}
//           <form className="space-y-6" onSubmit={handleSignup}>
//             <div>
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//                 className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 placeholder-gray-500"
//               />
//             </div>
//             <div>
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 placeholder-gray-500"
//               />
//             </div>
//             <div className="relative">
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full border-b-2 border-gray-300 focus:border-[#9AC9DE] outline-none py-2 placeholder-gray-500 pr-8"
//               />
//               <FiLock className="absolute right-0 bottom-2 text-gray-400" />
//             </div>

//             <button
//               type="submit"
//               className="w-full bg-[#9AC9DE] hover:bg-[#8bbacb] text-black font-semibold py-2 rounded-xl mt-4 text-sm"
//             >
//               Create Account
//             </button>
//           </form>

//           {/* Link to login */}
//           <p className="text-center text-gray-500 text-sm mt-6">
//             Already have an account?{" "}
//             <Link to="/login" className="text-blue-500 hover:underline">
//               Log In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;
