import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="mb-4">By using Notora, you agree to the following terms and conditions. Please read them carefully.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Use of Service</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>You must provide accurate information during registration.</li>
        <li>You are responsible for the content you upload.</li>
        <li>Do not use the platform for unlawful activities.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Intellectual Property</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>All content on Notora is protected by copyright laws.</li>
        <li>Do not copy or redistribute content without permission.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Limitation of Liability</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Notora is not liable for any damages resulting from use of the platform.</li>
        <li>We do not guarantee the accuracy of user-uploaded content.</li>
      </ul>
      <p className="mt-6">For any questions, contact us at <a href="mailto:shivanshgarg007@gmail.com" className="text-blue-600 underline">shivanshgarg007@gmail.com</a>.</p>
    </div>
  );
} 