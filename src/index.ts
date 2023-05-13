import { config } from "dotenv";
import SpotifyAuth from "./auth";
import Extractor from "./extractor";

// Make .env accessbile
config();

const auth = new SpotifyAuth(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
);

const main = async () => {
  const accessToken = await auth.requestAccessToken();
  const extractor = new Extractor(accessToken);

  await extractor.extract();
};

main();
