import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dahniduay',
  api_key: '你的API_KEY',
  api_secret: '你的API_SECRET',
});

export default async function handler(req, res) {
  try {
    const result = await cloudinary.search
      .expression('folder="events/ICCT-Pacific 2026"')
      .sort_by('created_at', 'desc')
      .max_results(200)
      .execute();

    res.status(200).json(result.resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}