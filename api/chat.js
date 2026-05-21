export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // CHANGED: Switched endpoint from ':generateContent' to ':streamGenerateContent'
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `You are a helpful AI assistant created by Chris. 
              PERSONAL INFO:
              - Created on: 4 April 2026.
              - Creator: Chris.
              - Creator's Email: rachvi47@gmail.com.
              - Chris's Friends: Vijay, Prasad, and Bhaskar.
              - Location: Chris is based in Vijayawada.
              - Current Date: April 4, 2026.
              - Current President: Donald Trump (47th).
              
              If anyone asks who made you or who owns this site, you must answer 'Chris'. 
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

    // Check for rate limit or quota errors before streaming starts
    if (response.status === 429) {
      return res.status(429).json({ reply: "QUOTA_EXCEEDED" });
    }

    if (!response.ok) {
      return res.status(response.status).json({ reply: "API connection error." });
    }

    // CHANGED: Set proper headers to handle a text stream
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // Hook up a data reader to parse Gemini's incoming streamed data packets
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Gemini streams responses as an array of JSON objects wrapped in brackets [ ... ]
      // This logic cleans up the brackets and parses individual chunks on the fly
      while (buffer.includes("\n")) {
        const parts = buffer.split("\n");
        const currentLine = parts.shift().trim();
        buffer = parts.join("\n");

        // Clean up formatting symbols that Gemini wraps around the stream lines
        let cleanLine = currentLine;
        if (cleanLine.startsWith("[")) cleanLine = cleanLine.substring(1);
        if (cleanLine.endsWith("]")) cleanLine = cleanLine.slice(0, -1);
        if (cleanLine.startsWith(",")) cleanLine = cleanLine.substring(1);

        cleanLine = cleanLine.trim();
        if (!cleanLine) continue;

        try {
          const jsonChunk = JSON.parse(cleanLine);
          if (jsonChunk.candidates?.[0]?.content?.parts?.[0]?.text) {
            const textChunk = jsonChunk.candidates[0].content.parts[0].text;
            // Write out the text segment directly to your front-end interface
            res.write(textChunk);
          }
        } catch (e) {
          // Skip lines that aren't fully completed JSON blocks yet
        }
      }
    }

    // Safely wrap up the transmission line
    res.end();

  } catch (error) {
    console.error("SERVER CRASHED:", error);
    if (!res.writableEnded) {
      res.status(500).json({ reply: "Server error. Check terminal." });
    }
  }
}
