import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Upload, FileText, Star, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const subjects = ["Java", "C++", "Web Development", "Python", "Data Structures", "Algorithms"];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
    isPremium: false,
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("File size should be less than 10MB");
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError("");

    try {
      // Validate file
      if (!formData.file) {
        setError("Please select a file to upload");
        setIsUploading(false);
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(formData.file.type)) {
        setError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
        setIsUploading(false);
        return;
      }

      // Validate file size (10MB)
      if (formData.file.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB");
        setIsUploading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("description", formData.content);
      formDataToSend.append("isPremium", formData.isPremium.toString());
      formDataToSend.append("file", formData.file);

      console.log("Sending form data:", {
        title: formData.title,
        subject: formData.subject,
        description: formData.content,
        isPremium: formData.isPremium,
        file: {
          name: formData.file.name,
          type: formData.file.type,
          size: formData.file.size
        }
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notes`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        alert("Notes uploaded successfully! Waiting for admin review.");
        navigate("/");
      }
    } catch (err) {
      console.error("Upload error:", err);
      let errorMessage = "Error uploading notes. Please try again.";
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
        console.error("Error response:", err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
        console.error("Error request:", err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || errorMessage;
        console.error("Error message:", err.message);
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Upload Your Notes</h1>
        <p className="text-gray-600 mb-6">You are required to login to use this feature.</p>
        <Link to="/login">
          <button className="bg-[#bbd9e8] text-gray-800 hover:bg-[#a8c8d7] py-2 px-4 rounded-lg font-medium transition-colors">Login</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Upload Your Notes</h1>
        <p className="text-gray-600">Share your knowledge with the community and help others learn</p>
      </div>

      {/* Guidelines */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Info className="w-5 h-5 mr-2 text-[#bbd9e8]" />
          <h2 className="text-lg font-semibold">Upload Guidelines</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Ensure your notes are well-organized and clearly written</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Include examples and practical applications where possible</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Supported formats: PDF, DOCX, TXT (Max 10MB)</span>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Premium content requires approval and may take 24-48 hours</span>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Note Details</h2>
          <p className="text-gray-600">Provide information about your notes to help others find them</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#bbd9e8] transition-colors">
              <input
                id="file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-[#bbd9e8]/10 rounded-full flex items-center justify-center mx-auto">
                    {formData.file ? (
                      <FileText className="w-6 h-6 text-[#bbd9e8]" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#bbd9e8]" />
                    )}
                  </div>
                  <div>
                    {formData.file ? (
                      <div className="space-y-1">
                        <p className="font-medium">{formData.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PDF, DOCX, TXT up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bbd9e8] focus:border-transparent"
              placeholder="e.g., Java Object-Oriented Programming Fundamentals"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <select
              id="subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bbd9e8] focus:border-transparent"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="content"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bbd9e8] focus:border-transparent"
              placeholder="Provide a detailed description of your notes content..."
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <label htmlFor="premium" className="text-sm font-medium text-gray-700">
                  Premium Content
                </label>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Premium
                </span>
              </div>
              <p className="text-sm text-gray-500">Mark as premium to earn revenue from downloads</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="premium"
                className="sr-only peer"
                checked={formData.isPremium}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPremium: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bbd9e8]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bbd9e8]"></div>
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#bbd9e8] text-gray-800 hover:bg-[#a8c8d7] py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || !formData.file || !formData.title || !formData.subject}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-800/30 border-t-gray-800 rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Notes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage; 