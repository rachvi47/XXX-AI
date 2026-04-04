export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // IMPORTANT: Use v1beta for tool support on Flash Lite
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          // FIXED: The field must be 'google_search' in the REST API
          tools: [
            {
              google_search: {},
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Check for API-level errors (like quota or naming)
    if (data.error) {
      return res.status(data.error.code || 500).json({ reply: "API ERROR: " + data.error.message });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ reply: "ERROR: No candidates returned. " + JSON.stringify(data) });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).json({ reply: "Server crashed" });
  }
}
