import { Router } from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { authmiddleware } from "../middlewares/authmiddleware.js";
import prisma from "../model/prisma.js";

dotenv.config();
const socialrouter = Router();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3002/auth/linkedin/callback";

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

// Step 1: Redirect user to LinkedIn auth
socialrouter.get("/auth/linkedin", authmiddleware, (req: any, res) => {
  const userId = req.user.userId;
  // Include user ID in the state parameter
  const state = `${crypto.randomBytes(16).toString("hex")}_${userId}`;
  
  const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=openid%20profile%20email%20w_member_social&state=${state}`;
  
  // Return the URL instead of redirecting
  res.json({
    success: true,
    url: authURL,
    state: state
  });
});

// Step 2: LinkedIn callback
socialrouter.get("/auth/linkedin/callback", async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    return res.redirect(`http://localhost:3000/dashboard/profile?error=${error}`);
  }

  if (!code) {
    return res.redirect(`http://localhost:3000/dashboard/profile?error=no_code`);
  }

  if (!state) {
    return res.redirect(`http://localhost:3000/dashboard/profile?error=no_state`);
  }

  // Extract user ID from state parameter
  const stateParts = (state as string).split('_');
  if (stateParts.length !== 2 || !stateParts[1]) {
    return res.redirect(`http://localhost:3000/dashboard/profile?error=invalid_state`);
  }

  const userId = stateParts[1]; // User ID is a UUID string

  try {
    // Use the original redirect URI for token exchange
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000, // 10 second timeout
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Calculate token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + (expires_in || 5184000)); // Default 60 days

    // Try to get LinkedIn user info (optional - don't fail if this doesn't work)
    // let linkedinUserId = null;
    // try {
    //   const userInfo = await axios.get("https://api.linkedin.com/v2/userinfo", {
    //     headers: { Authorization: `Bearer ${access_token}` },
    //     timeout: 5000, // 5 second timeout for user info
    //   });
    //   linkedinUserId = userInfo.data.sub;
    // } catch (userInfoError: any) {
    //   console.log("Could not fetch LinkedIn user info (non-critical):", userInfoError?.message || userInfoError);
    //   // Continue without user info - the access token is what's important
    // }

    // Update user with LinkedIn tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinAccessToken: access_token,
        linkedinRefreshToken: refresh_token,
        linkedinTokenExpiry: expiryDate,
        linkedinConnected: true,
      },
    });

    // Redirect back to frontend with success
    res.redirect(`http://localhost:3000/dashboard/profile?success=linkedin_connected`);

  } catch (err: any) {
    console.error("LinkedIn OAuth error:", err);
    
    // More specific error handling
    if (err?.code === 'ETIMEDOUT' || err?.code === 'ENETUNREACH') {
      console.error("Network timeout or unreachable - LinkedIn servers may be temporarily unavailable");
      res.redirect(`http://localhost:3000/dashboard/profile?error=network_timeout`);
    } else if (err?.response?.status === 400) {
      console.error("Bad request - likely invalid authorization code or redirect URI");
      res.redirect(`http://localhost:3000/dashboard/profile?error=invalid_request`);
    } else if (err?.response?.status === 401) {
      console.error("Unauthorized - likely invalid client credentials");
      res.redirect(`http://localhost:3000/dashboard/profile?error=unauthorized`);
    } else {
      res.redirect(`http://localhost:3000/dashboard/profile?error=oauth_failed`);
    }
  }
});

// Check LinkedIn connection status
socialrouter.get("/linkedin/status", authmiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        linkedinConnected: true,
        linkedinTokenExpiry: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isExpired = user.linkedinTokenExpiry && user.linkedinTokenExpiry < new Date();

    res.json({
      success: true,
      connected: user.linkedinConnected && !isExpired,
      expiry: user.linkedinTokenExpiry,
      isExpired: isExpired,
    });
  } catch (error) {
    console.error("Error checking LinkedIn status:", error);
    res.status(500).json({ error: "Failed to check LinkedIn status" });
  }
});

// Disconnect LinkedIn
socialrouter.post("/linkedin/disconnect", authmiddleware, async (req: any, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        linkedinAccessToken: null,
        linkedinRefreshToken: null,
        linkedinTokenExpiry: null,
        linkedinConnected: false,
      },
    });

    res.json({
      success: true,
      message: "LinkedIn account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting LinkedIn:", error);
    res.status(500).json({ error: "Failed to disconnect LinkedIn" });
  }
});

// Test LinkedIn connection
socialrouter.get("/linkedin/test", authmiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        linkedinAccessToken: true,
        linkedinConnected: true,
        linkedinTokenExpiry: true,
      },
    });

    if (!user || !user.linkedinConnected || !user.linkedinAccessToken) {
      return res.status(400).json({ error: "LinkedIn not connected" });
    }

    const isExpired = user.linkedinTokenExpiry && user.linkedinTokenExpiry < new Date();
    if (isExpired) {
      return res.status(400).json({ error: "LinkedIn token expired" });
    }

    // Test the access token by making a simple API call
    try {
      const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${user.linkedinAccessToken}` },
        timeout: 10000,
      });

      res.json({
        success: true,
        message: "LinkedIn connection is working",
        userInfo: {
          name: response.data.name,
          email: response.data.email,
          sub: response.data.sub,
        },
      });
    } catch (apiError: any) {
      console.error("LinkedIn API test failed:", apiError?.message);
      res.status(500).json({ 
        error: "LinkedIn API test failed", 
        details: apiError?.message || "Unknown error"
      });
    }
  } catch (error) {
    console.error("Error testing LinkedIn connection:", error);
    res.status(500).json({ error: "Failed to test LinkedIn connection" });
  }
});

export default socialrouter;
