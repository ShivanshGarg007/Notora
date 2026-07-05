import React from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const getRazorpayKey = async () => {
  try {
    const res = await fetch("/api/payment/razorpay-key");
    const data = await res.json();
    return data.key;
  } catch {
    return null;
  }
};

const PaymentForm = ({ onSuccess }) => {
  const { user } = useAuth();

  const handlePayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error("Failed to load Razorpay. Please try again.");
      return;
    }

    const key = await getRazorpayKey();
    if (!key) {
      toast.error("Unable to fetch payment key. Please try again later.");
      return;
    }

    const options = {
      key,
      amount: 100, // ₹1 in paise
      currency: "INR",
      name: "Notora Premium Upgrade",
      description: "Lifetime Premium Access",
      image: "/faviconNotora.png",
      handler: async function (response) {
        // Call backend to upgrade user
        try {
          const upgradeRes = await fetch("http://localhost:5000/api/auth/update-premium", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: user?.token ? `Bearer ${user.token}` : undefined,
            },
            credentials: "include",
          });
          if (upgradeRes.ok) {
            toast.success("You are now a premium user!");
            if (onSuccess) onSuccess();
          } else {
            toast.error("Upgrade failed. Please contact support.");
          }
        } catch (err) {
          toast.error("Upgrade failed. Please try again.");
        }
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      theme: {
        color: "#3399cc",
      },
      modal: {
        ondismiss: function () {
          toast("Payment cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
        onClick={handlePayment}
      >
        Pay ₹1 & Upgrade (Test Mode)
      </button>
      <p className="text-xs text-gray-500">You will be redirected to Razorpay's test checkout page.</p>
    </div>
  );
};

export default PaymentForm; 