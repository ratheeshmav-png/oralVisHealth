import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { initDB } from '../db.js';
import { authenticateRole } from '../middleware/auth.js';
import streamifier from 'streamifier';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
let db;

initDB().then(database => { db = database; });

// Technician: Upload scan
router.post('/upload', authenticateRole('Technician'), upload.single('image'), async (req, res) => {
  try {
    const { patientName, patientId, scanType, region } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Image is required' });

    const uploadStream = cloudinary.uploader.upload_stream(async (err, result) => {
      if (err) return res.status(500).json(err);
      const uploadDate = new Date().toISOString();
      await db.run(
        'INSERT INTO scans (patientName, patientId, scanType, region, imageUrl, uploadDate) VALUES (?, ?, ?, ?, ?, ?)',
        [patientName, patientId, scanType, region, result.secure_url, uploadDate]
      );
      res.json({ message: 'Scan uploaded successfully' });
    });
    streamifier.createReadStream(file.buffer).pipe(uploadStream);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dentist: View scans
router.get('/', authenticateRole('Dentist'), async (req, res) => {
  const scans = await db.all('SELECT * FROM scans ORDER BY uploadDate DESC');
  res.json(scans);
});

export default router;
