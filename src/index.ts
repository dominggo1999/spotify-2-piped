import { config } from "dotenv";
import SpotifyAuth from "./auth";
import Extractor from "./extractor";
import { createPrompts } from "./prompts";
import inquirer from "inquirer";

// Make .env accessbile
config();

const auth = new SpotifyAuth(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
);

const main = async () => {
  // Ask user for the options
  const options = await inquirer.prompt(createPrompts());

  // Authenticate
  const accessToken = await auth.requestAccessToken();

  // Extract information
  const extractor = new Extractor({
    accessToken,
    ...options,
  });

  await extractor.extract();
};

main();
