import axios from "axios";
import qs from "qs";
import fs from "fs";
import path from "path";
import os from "os";

class SpotifyAuth {
  OAUTH_TOKEN_URL = "https://accounts.spotify.com/api/token";

  constructor(public clientId: string, public clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async requestAccessToken(): Promise<null | string> {
    const headers = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: this.clientId,
        password: this.clientSecret,
      },
    };
    const data = {
      grant_type: "client_credentials",
    };

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        qs.stringify(data),
        headers,
      );
      return response.data.access_token;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default SpotifyAuth;

export const getCredentials = (): {
  clientId: string;
  clientSecret: string;
} => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  } else {
    const authFilePath = path.join(
      os.homedir(),
      ".spotify-2-piped",
      "spotify-auth.json",
    );

    if (fs.existsSync(authFilePath)) {
      const authData = JSON.parse(fs.readFileSync(authFilePath, "utf8")) as {
        SPOTIFY_CLIENT_ID: string;
        SPOTIFY_CLIENT_SECRET: string;
      };
      if (authData.SPOTIFY_CLIENT_ID && authData.SPOTIFY_CLIENT_SECRET) {
        return {
          clientId: authData.SPOTIFY_CLIENT_ID,
          clientSecret: authData.SPOTIFY_CLIENT_SECRET,
        };
      }
    }
    throw new Error(
      "Unable to find SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET. Please provide them either in .env file or in .spotify-2-piped/spotify-auth.json file.",
    );
  }
};
