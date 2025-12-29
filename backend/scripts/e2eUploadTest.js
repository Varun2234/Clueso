import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API = process.env.TEST_API_URL || 'http://localhost:5000/api';
const SAMPLE_URL = process.env.SAMPLE_VIDEO_URL || 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4';

const tempEmail = `copilot_test_${Date.now()}@example.com`;
const password = 'password123';

(async () => {
  try {
    console.log('1) Signing up test user', tempEmail);
    await axios.post(`${API}/auth/signup`, {
      fullName: 'Copilot Test',
      email: tempEmail,
      password
    });

    console.log('2) Logging in');
    const loginRes = await axios.post(`${API}/auth/login`, { email: tempEmail, password });
    const token = loginRes.data.token;
    if (!token) throw new Error('No token returned from login');

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

    console.log('6) Triggering AI insights (background endpoint)');
    // We will await this call in the test so we can inspect results synchronously
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
