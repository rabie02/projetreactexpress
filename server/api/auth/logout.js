const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Verify token if present
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        
        // Revoke ServiceNow token if exists
        if (decoded?.sn_access_token) {
          await axios.post(
            `${process.env.SERVICE_NOW_URL}/oauth_revoke_token.do`,
            new URLSearchParams({
              token: decoded.sn_access_token,
              client_id: process.env.CLIENT_ID,
              client_secret: process.env.CLIENT_SECRET
            }),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          );
        }
      } catch (verificationError) {
        console.warn('Token verification warning:', verificationError.message);
      }
    }

    // Set appropriate headers based on environment
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Only set Clear-Site-Data in production with HTTPS
    if (req.secure || process.env.NODE_ENV === 'production') {
      headers['Clear-Site-Data'] = '"cookies", "storage"';
    }

    return res
      .set(headers)
      .json({ 
        success: true,
        message: 'Logged out successfully'
      });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(200).json({ 
      success: true,
      message: 'Logged out (with some cleanup errors)'
    });
  }
});


module.exports = router;