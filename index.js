const express = require('express');
const { CohereClient } = require('cohere-ai'); // Use CommonJS syntax for Cohere
const cors = require('cors'); // Import cors
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000; // Use environment variable for flexibility

// Initialize Cohere client with API key
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // Ensure the API key is stored in a `.env` file
});

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Allow localhost for development
  })
);

// API route for generating a story
app.post('/generate-story', async (req, res) => {
  const { characterNames, genre, storyDescription } = req.body;

  // Input validation
  if (!Array.isArray(characterNames) || characterNames.length === 0 || !genre) {
    return res.status(400).json({
      error: 'Character names (array with descriptions) and genre are required.',
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
    .join('\n');

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
    // Generate the story using Cohere API
    const response = await cohere.generate({
      model: 'command', // Ensure you're using a valid model (e.g., 'command' or 'xlarge')
      prompt: prompt,
      max_tokens: 2000, // Limit token generation
      temperature: 0.7, // Adjust temperature for creativity
    });

    // Check for a valid response
    if (response?.generations?.length > 0) {
      const story = response.generations[0].text;
      return res.status(200).json({ story });
    } else {
      console.error('Error: Story generations not found in the response.');
      return res.status(400).json({ error: 'Failed to generate story content.' });
    }
  } catch (error) {
    console.error('Error generating story:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Default route to handle invalid endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
