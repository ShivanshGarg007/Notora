import React from 'react';
import OCRComponent from '../components/OCRComponent';

export default function OCRPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">OCR Image Processing</h1>
        <p className="text-gray-600 mb-8 text-center">
          Upload an image containing text to extract and process it using our OCR technology.
        </p>
        <OCRComponent />
      </div>
    </div>
  );
} 