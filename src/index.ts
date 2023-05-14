#!/usr/bin/env node

import { config } from "dotenv";
import SpotifyAuth, { getCredentials } from "./auth";
import Extractor from "./extractor";
import { createPrompts } from "./prompts";
import inquirer from "inquirer";

// Make .env accessbile
config();

const main = async () => {
  // Get credentials from .env or from config file (.spotify-2-piped/spotify-auth.json)
  const { clientId, clientSecret } = getCredentials();

  const auth = new SpotifyAuth(clientId, clientSecret);

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
