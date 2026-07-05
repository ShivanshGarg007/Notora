import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/notes/admin/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/notes/admin/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setPendingNotes(pendingRes.data);
      setAllNotes(allRes.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching notes');
      setLoading(false);
    }
  };

  const handleReview = async (noteId, status, comment = '') => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notes/admin/review/${noteId}`,
        { status, reviewComment: comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchNotes(); // Refresh the notes list
    } catch (err) {
      setError('Error reviewing note');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Pending Notes Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Pending Reviews</h2>
        <div className="grid gap-6">
          {pendingNotes.map((note) => (
            <div key={note._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{note.title}</h3>
                  <p className="text-gray-600">By: {note.user.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReview(note._id, 'approved')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(note._id, 'rejected')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{note.content}</p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {pendingNotes.length === 0 && (
            <p className="text-gray-500 text-center">No pending notes to review</p>
          )}
        </div>
      </section>

      {/* All Notes Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Notes</h2>
        <div className="grid gap-6">
          {allNotes.map((note) => (
            <div key={note._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{note.title}</h3>
                  <p className="text-gray-600">By: {note.user.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  note.status === 'approved' ? 'bg-green-100 text-green-800' :
                  note.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{note.content}</p>
              {note.reviewComment && (
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Review Comment:</span> {note.reviewComment}
                  </p>
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p>Uploaded: {new Date(note.createdAt).toLocaleDateString()}</p>
                {note.reviewedAt && (
                  <p>Reviewed: {new Date(note.reviewedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard; 