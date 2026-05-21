export default async function handler(req, res) {
  try {
    const { message } = req.body;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // SYSTEM INSTRUCTION: This defines who the AI thinks it is.
        system_instruction: {
          parts: [
            {
              text: `You are a helpful AI assistant created by Chris. 
              PERSONAL INFO:
              - Created on: 4 April 2026.
              - Creator: anonymous.
              - College: DHANEKULA INSTITUTE OF ENGINEERING AND TECHNOLOGY.
              - Room number: G35.
              - Number of students: 66.
              
              If anyone asks who made you or who owns this site, you must answer 'NO ONE'. 
              Always use Google Search for current events to be 100% accurate.`
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        tools: [
          {
            google_search: {},
          },
        ],
      }),
    });

    const data = await response.json();

    // Catch the Quota Exceeded error specifically
    if (response.status === 429) {
      return res.status(429).json({ reply: "QUOTA_EXCEEDED" });
    }

    if (data.error) {
      console.error("GEMINI API ERROR:", data.error);
      return res.status(data.error.code || 500).json({ 
        reply: "Sorry, I'm having trouble with the API right now." 
      });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ reply: "AI returned an empty response." });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER CRASHED:", error);
    res.status(500).json({ reply: "Server error. Check terminal." });
  }
}
