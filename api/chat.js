export default async function handler(req, res) {
  try {
    const { message } = req.body;

    // --- YOUR RANDOM INFO GOES HERE ---
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ 
              text: `You are an assistant for chris's website. Use the provided context to answer questions.` 
            }]
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: `CONTEXT INFO: ${mySecretInfo}` }, // Feed the info here
                { text: `USER QUESTION: ${message}` }    // Then the user prompt
              ]
            }
          ],
          tools: [{ google_search: {} }]
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ reply: "Server crashed" });
  }
}
