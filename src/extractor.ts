import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import fs from "fs";
import yts from "yt-search";
import { createSpinner } from "nanospinner";

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createSpotifyApi = (accessToken: string) => {
  const config: AxiosRequestConfig = {
    baseURL: "https://api.spotify.com/v1",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  return axios.create(config);
};

class Extractor {
  private spotifyApi: AxiosInstance;

  // TODO : extract options from cli arguments
  public userId: string = process.env.SPOTIFY_USER_ID as string;

  constructor(accessToken: string) {
    this.spotifyApi = createSpotifyApi(accessToken);
  }

  async getTracks(playlistId: string) {
    // Get playlist
    const { data: tracks } = await this.spotifyApi.get(
      "/playlists/" + playlistId + "/tracks",
    );

    return tracks;
  }

  async searchYoutube({ title, artist }: { title: string; artist: string }) {
    const searchresults = await yts.search(`${title} ${artist}`);

    if (searchresults.videos.length === 0) {
      return null;
    }

    return searchresults.videos[0].url;
  }

  getArtistNames(artists: { name: string }[]) {
    return artists.reduce((acc, curr) => {
      return acc + curr.name + ", ";
    }, "");
  }

  async extract() {
    // TODO : extract options from cli arguments
    const tracks = await this.getTracks("37i9dQZF1EIUQyRBujw1me");

    const urls: (string | null)[] = [];

    for (const track of tracks.items) {
      const title = track.track.name;
      const artist = this.getArtistNames(track.track.artists);
      const searchParams = {
        title,
        artist,
      };

      // Delay before making the request
      await delay(200 + Math.random() * 800);
      const spinner = createSpinner(
        `Searching for : ${title} by ${artist}`,
      ).start();

      const url = await this.searchYoutube(searchParams);
      spinner.success();

      urls.push(url);
    }

    // TODO : get the name from cli args
    // Template
    const pipedBookmarks = {
      format: "Piped",
      version: 1,
      playlists: [
        {
          name: "first-try",
          type: "playlist",
          visibility: "private",
          videos: urls.filter((i) => i),
        },
      ],
    };

    // Save pipedBookmarks to file
    fs.writeFileSync(
      "./results/pipedBookmarks.json",
      JSON.stringify(pipedBookmarks),
    );

    console.log("Piped bookmarks successfully created");
  }
}

export default Extractor;
