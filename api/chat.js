export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // 1. Point to the v1beta endpoint for 2026 feature support
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 2. SYSTEM INSTRUCTION: This fixes your "Who made you" issue
        system_instruction: {
          parts: [
            {
              text: `You are a helpful AI assistant. You were created by Chris on 4 April 2026. Chris's email is rachvi47@gmail.com. If anyone asks who made you, created you, or owns this site, you must answer 'Chris'. Today is April 4, 2026. Donald Trump is the 47th President of the United States. Use Google Search for all current events.`
            }
          ]
        },
        // 3. CONTENTS: The actual conversation
        contents: [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
        // 4. TOOLS: Enables real-time 2026 data searching
        tools: [
          {
            google_search: {},
          },
        ],
      }),
    });

    const data = await response.json();

    // ERROR HANDLING: Stop the "Server Crashed" mystery
    if (data.error) {
      console.error("GEMINI API ERROR:", data.error);
      return res.status(data.error.code || 500).json({ 
        reply: `API ERROR: ${data.error.message}` 
      });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ reply: "AI returned an empty response. Check API logs." });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER CRASHED:", error);
    res.status(500).json({ reply: "Backend error. Check terminal/console." });
  }
}
