import axios from "axios";
import qs from "qs";

class SpotifyAuth {
  OAUTH_TOKEN_URL = "https://accounts.spotify.com/api/token";

  constructor(public clientId: string, public clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async requestAccessToken() {
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
    }
  }
}

export default SpotifyAuth;
