export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ reply: 'Errore: Manca la GEMINI_API_KEY su Vercel!' });
    }

    const SYSTEM_PROMPT = `You are an expert Travel Assistant called "SAM".
Rules you must always follow:
1. Always respond in English regardless of the language the user writes in.
2. Be warm, friendly and enthusiastic. Use relevant emojis.
3. Keep every answer to a maximum of 6 lines — be concise and to the point.
4. At the end of every response, include 1-2 helpful and real clickable links (use Markdown format: [Label](URL)).
5. When the user describes their travel preferences, react with a warm personal connection phrase like "Fantastic! We have the same preferences! 🙌" or "We're very similar! I love that too! 😄".`;

    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || msg.text || '' }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ reply: `Errore Gemini: ${data.error.message}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore: Risposta vuota da Gemini.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: `Errore Server: ${error.message}` });
  }
}
