import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Your privacy is important to us. This Privacy Policy explains how Notora collects, uses, and protects your information when you use our platform.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Personal information (name, email, etc.) provided during registration</li>
        <li>Usage data and analytics</li>
        <li>Uploaded content and files</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Information</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To provide and improve our services</li>
        <li>To communicate with you about updates and offers</li>
        <li>To ensure platform security and integrity</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Your Rights</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Access, update, or delete your personal information</li>
        <li>Opt out of marketing communications</li>
      </ul>
      <p className="mt-6">For any questions regarding your privacy, please contact us at <a href="mailto:shivanshgarg007@gmail.com" className="text-blue-600 underline">shivanshgarg007@gmail.com</a>.</p>
    </div>
  );
} 