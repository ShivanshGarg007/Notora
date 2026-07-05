import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    // Debug logging
    console.log('AdminRoute - Current user:', user);
    console.log('AdminRoute - Loading state:', loading);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        console.log('AdminRoute - No user found, redirecting to home');
        return <Navigate to="/" replace />;
    }

    if (user.role !== 'admin') {
        console.log('AdminRoute - User is not admin, redirecting to home');
        return <Navigate to="/" replace />;
    }

    console.log('AdminRoute - User is admin, rendering admin content');
    return children;
} 