const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini client with API key
const genAI = new GoogleGenerativeAI(process.env.COHERE_API_KEY);

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(
  cors({
    origin: true, // Allow all origins
  })
);


// API route for generating a story
app.post("/generate-story", async (req, res) => {
  const { characterNames, genre, storyDescription } = req.body;

  // Input validation
  if (!Array.isArray(characterNames) || characterNames.length === 0 || !genre) {
    return res.status(400).json({
      error: "Character names (array with descriptions) and genre are required.",
    });
  }

  // Validate each character entry
  const invalidCharacter = characterNames.find(
    (char) => !char.characterName || !char.description
  );
  if (invalidCharacter) {
    return res.status(400).json({
      error: `Each character must have a 'characterName' and 'description'. Invalid character: ${JSON.stringify(
        invalidCharacter
      )}`,
    });
  }

  // Build character descriptions dynamically
  const characterDetails = characterNames
    .map((char) => `${char.characterName}: ${char.description}`)
    .join("\n");

  // Construct the prompt
  const prompt = `
Create a detailed ${genre} story based on the following description and characters:

Story Description:
${storyDescription || "No specific description provided."}

Character Descriptions:
${characterDetails}

Ensure the story includes at least 2000 words and develops the characters meaningfully within the narrative.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const story = result.response.text();

    if (story) {
      console.log(story);
      res.status(200).json({ story });
    } else {
      console.log("Error: Story generation failed.");
      return res.status(400).json({ error: "Failed to generate story content" });
    }
  } catch (error) {
    console.error("Error generating story:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Default route to handle invalid endpoints
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
