import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Trash2, Shield, Activity, Users, BarChart3 } from 'lucide-react';

const RateLimitMonitor = () => {
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login as admin.');
      }

      const response = await fetch(`${API_BASE_URL}/api/rate-limit/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login as admin.');
        }
        throw new Error(`Failed to fetch rate limit stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rate-limit/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch rate limit config');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetRateLimit = async (type, identifier = null) => {
    setResetLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const url = identifier 
        ? `${API_BASE_URL}/api/rate-limit/admin/reset`
        : `${API_BASE_URL}/api/rate-limit/admin/reset/${type}`;
      
      const body = identifier 
        ? { identifier, type }
        : {};
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset rate limit');
      }
      
      // Refresh stats after reset
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const resetAllRateLimits = async () => {
    if (!window.confirm('Are you sure you want to reset ALL rate limits? This will affect all users.')) {
      return;
    }
    
    setResetLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/rate-limit/admin/reset-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset all rate limits');
      }
      
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchStats(), fetchConfig()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchStats().finally(() => setLoading(false));
            }}
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Shield className="w-8 h-8 mr-3 text-blue-600" />
          <h2 className="text-3xl font-bold">Rate Limit Monitor</h2>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchStats}
            disabled={resetLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${resetLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={resetAllRateLimits}
            disabled={resetLoading}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-medium"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Summary Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats?.totalKeys || 0}
              </div>
              <div className="text-sm text-gray-600">Total Active Limits</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats?.summary?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Rate Limit Types</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats?.summary?.reduce((sum, type) => sum + type.totalRequests, 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Rate Limit Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.summary?.map((type) => (
              <div key={type.type} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-semibold text-lg capitalize">{type.type}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {config?.description?.[type.type] || 'No description'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Limit: {config?.limits?.[type.type]?.max || 'N/A'} requests per 
                    {Math.round((config?.limits?.[type.type]?.windowMs || 0) / 1000 / 60)} minutes
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {type.activeIdentifiers} active
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    {type.totalRequests} requests
                  </Badge>
                  <Button
                    onClick={() => resetRateLimit(type.type)}
                    disabled={resetLoading}
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ))}
            {(!stats?.summary || stats.summary.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No rate limit data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(stats?.stats || {}).map(([type, identifiers]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 capitalize text-gray-800">{type}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(identifiers).map(([identifier, count]) => (
                    <div key={identifier} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                      <span className="text-sm font-mono truncate text-gray-700">{identifier}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          {count}
                        </Badge>
                        <Button
                          onClick={() => resetRateLimit(type, identifier)}
                          disabled={resetLoading}
                          variant="destructive"
                          size="sm"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!stats?.stats || Object.keys(stats.stats).length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No detailed statistics available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateLimitMonitor; 