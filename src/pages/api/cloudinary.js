import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dahniduay',
  api_key: '你的API_KEY',
  api_secret: '你的API_SECRET',
});

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression('folder="events/ICCT-Pacific 2026"')
      .sort_by('created_at', 'desc')
      .max_results(200)
      .execute();

    return new Response(JSON.stringify(result.resources), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}