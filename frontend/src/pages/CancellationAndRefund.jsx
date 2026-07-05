import React from "react";

export default function CancellationAndRefund() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Cancellation and Refund Policy</h1>
      <p className="mb-4">We strive to provide the best experience. Please review our cancellation and refund policy below.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Cancellations</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>You may cancel your subscription at any time from your account settings.</li>
        <li>Access to premium features will remain until the end of your billing cycle.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Refunds</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Refunds are only provided for accidental duplicate payments or technical errors.</li>
        <li>To request a refund, contact us within 7 days of the transaction.</li>
      </ul>
      <p className="mt-6">For refund requests, email <a href="mailto:shivanshgarg007@gmail.com" className="text-blue-600 underline">shivanshgarg007@gmail.com</a> with your payment details.</p>
    </div>
  );
} 