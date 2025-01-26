const express = require('express');
const { CohereClient } = require('cohere-ai'); // Use CommonJS syntax
const cors = require('cors'); // Import cors

require('dotenv').config();

const app = express();
const port = 5000;

// Initialize Cohere client with API key
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // Replace with your API key
});

// Middleware to parse JSON
app.use(express.json());
app.use(cors());
// API route for generating a story
// API route for generating a story
app.post('/generate-story', async (req, res) => {
    const { characterNames, genre, storyDescription } = req.body;
  
    // Validate input
    if (!characterNames || !Array.isArray(characterNames) || characterNames.length === 0 || !genre) {
      return res.status(400).send({
        error: 'Character names (array with descriptions), genre, and optionally a story description are required.',
      });
    }
  
    // Validate each character entry
    const invalidCharacter = characterNames.find((char) => !char.characterName || !char.description);
    if (invalidCharacter) {
      return res.status(400).send({
        error: `Each character must have a 'characterName' and 'description'. Invalid character: ${JSON.stringify(invalidCharacter)}`,
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
    const response = await cohere.generate({
      model: 'command', // Ensure you're using a valid model
      prompt: prompt,
      max_tokens: 2000,
      temperature: 0.7,
    });
  
    // Log the response to check its structure
    console.log(response);
  
    // Check if 'generations' exists in the response body
    if (response && response.generations && response.generations.length > 0) {
        const story = response.generations[0].text;
        console.log(story);
        res.status(200).json({ story }); // Send the story in the response with status code 200
      } else {
        console.log('Error: Story generations not found in the response.');
        return res.status(400).json({ error: 'Failed to generate story content' });
      }
      
  } catch (error) {
    console.error('Error generating story:', error);
    return res.status(500).send({ error: 'Error generating the story.' });
  }
  
  });
  

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
