export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // Hits v1beta for tool And system_instruction support
    const mySecretInfo = `
      FACTS TO REMEMBER:
      - This website was created by CHRIS.
      - Our official launch date was 4 April 2026.
      - We offer 24/7 support via email at rachvi47@gmail.com.
      - [ADD ANY OTHER RANDOM DATA HERE]
    `;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 1. SYSTEM INSTRUCTION: This forces the AI to acknowledge 2026 reality
          system_instruction: {
            parts: [
              {
                text: "You are a helpful assistant. The current date is April 4, 2026. Donald Trump is the 47th President of the United States. Use the provided Google Search tool for any questions regarding current events or political history to ensure accuracy."
              }
            ]
          },
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          // 2. TOOLS: Correct naming for the REST API
          tools: [
            {
              google_search: {},
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Catch API errors (Quota, naming, etc.)
    if (data.error) {
      return res.status(data.error.code || 500).json({ 
        reply: "API ERROR: " + data.error.message 
      });
    }

    // Safety check for empty responses
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ 
        reply: "ERROR: No response from AI. " + JSON.stringify(data) 
      });
    }

    // Extracting the text from the model response
    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    console.log("SERVER CRASHED:", error);
    res.status(500).json({ reply: "Internal Server Error" });
  }
}
