export async function GET(request) {
  return Response.json({ 
    status: 'OK', 
    message: 'AI Autocomplete API is running',
    timestamp: new Date().toISOString()
  });
}
