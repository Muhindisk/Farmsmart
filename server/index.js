import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();

// CORS configuration - allow frontend origins
const allowedOrigins = [
  'https://farmsmart-sand.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// Supabase service client (server-side only)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Handle preflight OPTIONS request explicitly
app.options('/api/chat', cors());

app.post('/api/chat', async (req, res) => {
  try {
    const { name, location, soil_type, soil_ph, rainfall_mm, crop, user_query } = req.body || {};

    // Gemini credentials: require GEMINI_API_KEY (use API key to call Google GenAI SDK)
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'server_misconfigured', message: 'Missing GEMINI_API_KEY. Set GEMINI_API_KEY in server/.env to a valid API key or access token.' });
    }

    const systemPrompt = `You are an expert agricultural advisor specialising in regenerative farming and soil health. Provide clear, practical recommendations for smallholder farmers.`;
    const userContext = `Context:
- Location: ${location || 'unknown'}
- Soil Type: ${soil_type || 'unknown'}
- Soil pH: ${soil_ph ?? 'unknown'}
- Recent rainfall (mm in last 30 days): ${rainfall_mm ?? 'unknown'}
- Crop/Focus: ${crop || 'general'}

Question: ${user_query || 'General advice'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContext }
    ];

    // Gemini-only: call Google AI generativeLanguage API directly with API key
    let aiText = null;
    try {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

        // Use the provided API key and call the Generative API directly to avoid ADC
        const apiKey = process.env.GEMINI_API_KEY;
        
        // Build a complete prompt with all context for agricultural advice
        const fullPrompt = `You are an expert agricultural advisor specializing in regenerative farming and soil health for smallholder farmers.

Farmer's Context:
- Location: ${location || 'Not specified'}
- Soil Type: ${soil_type || 'Not specified'}
- Soil pH: ${soil_ph ?? 'Not specified'}
- Recent rainfall (last 30 days): ${rainfall_mm ? rainfall_mm + ' mm' : 'Not specified'}
- Crop/Focus: ${crop || 'General farming'}

Question: ${user_query || 'Please provide general agricultural advice.'}

Please provide clear, practical recommendations.`;

        const contents = [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ];

        const url = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent`;
        const genResp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              maxOutputTokens: 16384,
              temperature: 0.7,
              topP: 0.95,
              topK: 40
            }
          })
        });

        if (!genResp.ok) {
          const txt = await genResp.text();
          console.error('Gemini HTTP error', genResp.status, txt);
          return res.status(502).json({ error: 'gemini_error', status: genResp.status, details: txt });
        }

        const genJson = await genResp.json();

        // Parse Gemini REST API response: candidates[0].content.parts[0].text
        const candidate = genJson?.candidates?.[0];
        if (!candidate) {
          console.warn('No candidate in response');
          aiText = 'No response generated. Full response: ' + JSON.stringify(genJson);
        } else if (candidate?.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
          // Extract text from all parts
          const textParts = candidate.content.parts
            .filter(p => p?.text)
            .map(p => p.text);
          
          if (textParts.length > 0) {
            aiText = textParts.join('\n');
          } else {
            console.warn('No text in parts:', candidate.content.parts);
            aiText = 'Response parts exist but contain no text. Parts: ' + JSON.stringify(candidate.content.parts);
          }
        } else if (candidate?.text) {
          aiText = candidate.text;
        } else if (candidate?.output) {
          // Try alternative response format
          aiText = typeof candidate.output === 'string' ? candidate.output : JSON.stringify(candidate.output);
        } else {
          console.warn('Unexpected candidate structure. FinishReason:', candidate.finishReason);
          console.warn('Full candidate:', JSON.stringify(candidate, null, 2));
          
          // If MAX_TOKENS, the response was truncated - likely means content.parts is empty
          if (candidate.finishReason === 'MAX_TOKENS') {
            aiText = 'Response was truncated (MAX_TOKENS reached). Try increasing maxOutputTokens or simplifying the request. No content was returned in the response.';
          } else {
            aiText = 'Unexpected response structure. FinishReason: ' + candidate.finishReason + '. Full candidate: ' + JSON.stringify(candidate);
          }
        }
    } catch (gErr) {
      // Log full error for diagnostics (including nested response data when available)
      try {
        console.error('Gemini request failed (full):', gErr);
        if (gErr.response) console.error('Gemini error response:', JSON.stringify(gErr.response, Object.getOwnPropertyNames(gErr.response)));
      } catch (logErr) {
        console.error('Error while logging Gemini error:', logErr);
      }
      // Return a concise error to the client but include the original message if available
      return res.status(502).json({ error: 'gemini_request_failed', details: gErr.message || 'Unknown error' });
    }

    // Save to Supabase (best-effort; warn but don't fail on DB error)
    try {
      const { data, error } = await supabase.from('projects').insert([{
        name: name || 'anonymous',
        location,
        soil_type,
        soil_ph: soil_ph || null,
        rainfall_mm: rainfall_mm || null,
        crop,
        user_query,
        ai_response: aiText
      }]).select();
      if (error) console.warn('Supabase insert warning:', error.message);
    } catch (dbErr) {
      console.warn('Supabase client error', dbErr.message || dbErr);
    }

    return res.json({ success: true, ai_response: aiText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', details: err.message || err });
  }
});

// Simple health-check / informational route so a browser GET / doesn't return "Cannot GET /"
app.get('/', (req, res) => {
  res.send('FarmSmart server is running. POST to /api/chat to interact with the AI.');
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
