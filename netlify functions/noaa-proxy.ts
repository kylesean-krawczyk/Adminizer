import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const noaaApiKey = process.env.NOAA_API_KEY;
    
    if (!noaaApiKey) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'NOAA API key not configured in Netlify environment variables.' }),
      };
    }

    // Extract query parameters from the request
    const { datasetid, locationid, startdate, enddate, datatypeid, limit = '1000' } = event.queryStringParameters || {};

    if (!datasetid || !locationid || !startdate || !enddate) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required query parameters: datasetid, locationid, startdate, enddate.' }),
      };
    }

    // Construct NOAA API URL
    let noaaApiUrl = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=${datasetid}&locationid=${locationid}&startdate=${startdate}&enddate=${enddate}&limit=${limit}`;
    
    if (datatypeid) {
      noaaApiUrl += `&datatypeid=${datatypeid}`;
    }

    console.log('Fetching from NOAA API:', noaaApiUrl);

    const response = await fetch(noaaApiUrl, {
      headers: {
        'token': noaaApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMessage = `NOAA API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = `NOAA API error: ${errorData.message || response.statusText}`;
        console.error('NOAA API response error:', errorData);
      } catch (parseError) {
        console.error('Failed to parse NOAA error response:', parseError);
      }
      
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: errorMessage }),
      };
    }

    const data = await response.json();
    console.log('NOAA API response received, results count:', data.results?.length || 0);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('NOAA proxy function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
    };
  }
};

export { handler };