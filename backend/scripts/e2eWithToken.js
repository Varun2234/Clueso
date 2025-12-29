import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API = process.env.TEST_API_URL || 'http://localhost:5000/api';
const SAMPLE_URL = process.env.SAMPLE_VIDEO_URL || 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4';
let token = process.env.E2E_TOKEN;
if (!token) {
  // If no token passed, create/find test user and generate a JWT locally
  console.log('No E2E_TOKEN provided, creating/using local test user');
  const jwt = (await import('jsonwebtoken')).default;
  const mongoose = await import('mongoose');
  const User = (await import('../models/User.js')).default;
  const connectDB = (await import('../config/db.js')).default;
  await connectDB();
  const email = 'copilot_e2e@example.com';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ fullName: 'Copilot E2E', email, password: 'password123' });
    console.log('Created test user', user._id);
  }
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

(async () => {
  try {
    console.log('Using token (truncated):', token.slice(0, 20) + '...');

    console.log('3) Downloading sample video');
    const downloadRes = await axios.get(SAMPLE_URL, { responseType: 'arraybuffer', timeout: 120000 });
    const tmpPath = path.join(__dirname, `tmp_${Date.now()}.mp4`);
    fs.writeFileSync(tmpPath, Buffer.from(downloadRes.data));
    console.log('   Saved sample to', tmpPath);

    console.log('4) Uploading video to /video/upload');
    const form = new FormData();
    form.append('video', fs.createReadStream(tmpPath));

    const uploadRes = await axios.post(`${API}/video/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    });

    console.log('   Upload response:', uploadRes.data);
    const videoId = uploadRes.data._id || uploadRes.data.id;
    if (!videoId) throw new Error('No video id returned');

    console.log('5) Creating feedback entry');
    const fbRes = await axios.post(`${API}/feedback`, {
      title: 'E2E Test Feedback',
      description: 'This is a test feedback entry from Copilot E2E script',
      videoId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('   Feedback created:', fbRes.data._id || fbRes.data.id);
    const feedbackId = fbRes.data._id || fbRes.data.id;

    console.log('6) Triggering AI insights (wait for completion)');
    const insightsRes = await axios.post(`${API}/video/${videoId}/insights`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 300000
    });

    console.log('   Insights response:', insightsRes.data);

    console.log('7) Fetching feedback detail to check aiSummary');
    const detail = await axios.get(`${API}/feedback/${feedbackId}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('   Feedback detail:', JSON.stringify(detail.data, null, 2));

    console.log('\nE2E test completed successfully ✅');
    // cleanup tmp file
    try { fs.unlinkSync(tmpPath); } catch (e) {}
  } catch (err) {
    console.error('E2E Test failed:', err?.response?.data || err.message || err);
    process.exitCode = 1;
  }
})();
