import React from "react";

export default function ShippingAndDelivery() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Shipping and Delivery Policy</h1>
      <p className="mb-4">Notora is a digital platform. All content and services are delivered electronically.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Digital Delivery</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>All notes and resources are available for download immediately after purchase or registration.</li>
        <li>No physical products are shipped.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Access Issues</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>If you experience issues accessing your content, please contact our support team.</li>
      </ul>
      <p className="mt-6">For support, email <a href="mailto:shivanshgarg007@gmail.com" className="text-blue-600 underline">shivanshgarg007@gmail.com</a>.</p>
    </div>
  );
} 