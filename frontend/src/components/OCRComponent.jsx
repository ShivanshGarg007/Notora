import React, { useState } from 'react';
import axios from 'axios';

const OCRComponent = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/ocr/process`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err) {
            console.error('OCR Error:', err);
            setError(err.response?.data?.error || 'Error processing image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">OCR Image Processing</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full"
                    />
                </div>

                {preview && (
                    <div className="mt-4">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-w-full h-auto rounded-lg"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!selectedFile || loading}
                    className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
                        !selectedFile || loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {loading ? 'Processing...' : 'Extract Text'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Extracted Text:</h3>
                    <div className="whitespace-pre-wrap">{result.text}</div>
                    {result.confidence && (
                        <div className="mt-2 text-sm text-gray-600">
                            Confidence: {(result.confidence * 100).toFixed(2)}%
                        </div>
                    )}
                    {result.language && (
                        <div className="mt-1 text-sm text-gray-600">
                            Detected Language: {result.language}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OCRComponent; 