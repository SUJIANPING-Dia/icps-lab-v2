import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dahniduay',
  api_key: '371257267424889',
  api_secret: 'lXOLsgktpVS2EgiBHwxp5p-5L_A',
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
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}