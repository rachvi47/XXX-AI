export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // 1. Switch to v1beta for the latest 2026 features (like Search)
    // 2. Use 'gemini-3.1-flash-lite-preview' - the current free-tier king
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message // Keep it simple, the tool handles the 'search' logic
              }
            ]
          }
        ],
        // The field MUST be 'google_search' in the REST API (not googleSearchRetrieval)
        tools: [
          {
            google_search: {} 
          }
        ]
      }),
    });

    const data = await response.json();

    // Log this to your terminal to see the search sources!
    console.log("DEBUG:", JSON.stringify(data));

    if (data.error) {
      return res.status(data.error.code || 500).json({ 
        reply: `API Error: ${data.error.message}` 
      });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ reply: "No response from AI." });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    console.error("CRASH:", error);
    res.status(500).json({ reply: "Server crashed. Check logs." });
  }
}
