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
5. When the user describes their travel preferences, react with a warm personal connection phrase like "Fantastic! We have the same preferences! 🙌" or "We're very similar! I love that too! 😄".
6. Always end your response with an engaging question to keep the conversation going and learn more about the user's travel plans.`;

    // Iniettiamo le istruzioni direttamente all'inizio della conversazione
    const contents = [
      {
        role: 'user',
        parts: [{ text: `Instructions for this chat: ${SYSTEM_PROMPT}\n\nUnderstood? Please acknowledge and wait for my next message.` }]
      },
      {
        role: 'model',
        parts: [{ text: "Understood perfectly. I am SAM, your warm and friendly Travel Assistant. I will follow all rules and respond in English within 6 lines, ending with a question." }]
      }
    ];

    // Appendiamo i messaggi scambiati dall'utente
    messages.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || msg.text || '' }]
      });
    });

    // Endpoint pulito senza parametri contestati
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents })
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
