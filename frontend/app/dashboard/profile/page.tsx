"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface LinkedInStatus {
  connected: boolean;
  expiry: string | null;
  isExpired: boolean;
}

function ProfileContent() {
  const { user, isAuthenticated, token } = useAuth();
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const searchParams = useSearchParams();

  // Fetch LinkedIn connection status
  const fetchLinkedInStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get("http://localhost:3002/linkedin/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setLinkedInStatus(response.data);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn status:", error);
    }
  }, [token]);

  // Check for OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'linkedin_connected') {
      setMessage("LinkedIn connected successfully!");
      fetchLinkedInStatus();
      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard/profile');
    } else if (error) {
      let errorMessage = "Failed to connect LinkedIn";
      switch (error) {
        case 'access_denied':
          errorMessage = "LinkedIn access was denied";
          break;
        case 'no_code':
          errorMessage = "No authorization code received";
          break;
        case 'no_state':
          errorMessage = "No state parameter received";
          break;
        case 'invalid_state':
          errorMessage = "Invalid state parameter";
          break;
        case 'invalid_user_id':
          errorMessage = "Invalid user ID in request";
          break;
        case 'network_timeout':
          errorMessage = "Network timeout - LinkedIn servers may be temporarily unavailable";
          break;
        case 'invalid_request':
          errorMessage = "Invalid request - please try connecting again";
          break;
        case 'unauthorized':
          errorMessage = "Unauthorized - LinkedIn app credentials may be invalid";
          break;
        case 'oauth_failed':
          errorMessage = "LinkedIn OAuth failed";
          break;
      }
      setMessage(errorMessage);
      // Clear URL parameters
      window.history.replaceState({}, '', '/dashboard/profile');
    }
  }, [searchParams, fetchLinkedInStatus]);

  // Load LinkedIn status on component mount
  useEffect(() => {
    fetchLinkedInStatus();
  }, [fetchLinkedInStatus]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  // Connect to LinkedIn
  const connectLinkedIn = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.get("http://localhost:3002/auth/linkedin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("LinkedIn auth response:", response.data);
      if (response.data.success && response.data.url) {
        // Redirect to LinkedIn OAuth
        window.location.href = response.data.url;
      } else {
        setMessage("Failed to get LinkedIn authorization URL");
      }
    } catch (error) {
      console.error("Error connecting to LinkedIn:", error);
      setMessage("Failed to connect to LinkedIn");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect LinkedIn
  const disconnectLinkedIn = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post("http://localhost:3002/linkedin/disconnect", {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setMessage("LinkedIn disconnected successfully!");
        setLinkedInStatus({ connected: false, expiry: null, isExpired: false });
      } else {
        setMessage("Failed to disconnect LinkedIn");
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      setMessage("Failed to disconnect LinkedIn");
    } finally {
      setLoading(false);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!linkedInStatus?.expiry) return null;
    
    const expiryDate = new Date(linkedInStatus.expiry);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">LinkedIn Integration</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('success') || message.includes('connected') 
              ? 'bg-green-900 text-green-100' 
              : 'bg-red-900 text-red-100'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {linkedInStatus === null ? (
            <p className="text-gray-300">Checking LinkedIn connection status...</p>
          ) : linkedInStatus.connected && !linkedInStatus.isExpired ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">LinkedIn Connected</span>
              </div>
              
              {daysUntilExpiry !== null && (
                <p className="text-gray-300">
                  Expires in: {daysUntilExpiry} days
                </p>
              )}
              
              <Button 
                onClick={disconnectLinkedIn}
                disabled={loading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Disconnecting..." : "Disconnect LinkedIn"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-400 font-medium">
                  {linkedInStatus?.isExpired ? "LinkedIn Token Expired" : "LinkedIn Not Connected"}
                </span>
              </div>
              
              <Button 
                onClick={connectLinkedIn}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Connecting..." : "Connect to LinkedIn"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <p className="text-white">Loading...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
