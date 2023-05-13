import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import fs from "fs";
import yts from "yt-search";
import { createSpinner } from "nanospinner";
import { Album, AlbumItem, Playlist, PlaylistItem } from "./types";

interface ExtractOptions {
  url: string;
  accessToken: string;
}

type UrlType = "playlist" | "album";

type SeachParams = {
  title: string;
  artist: string;
  albumName: string;
};

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

  constructor(public options: ExtractOptions) {
    this.spotifyApi = createSpotifyApi(options.accessToken);
    this.options = options;
  }

  getUrlType(): { type: UrlType; id: string } | null {
    const url = this.options.url;
    const idRegex = /\/(album|playlist)\/([\w\d]+)/;
    const match = url.match(idRegex);

    const [, urlType, id] = match as [string, UrlType, string];

    switch (urlType) {
      case "playlist":
        return { type: "playlist", id };
      case "album":
        return { type: "album", id };
      default:
        return null;
    }
  }

  async getTracks() {
    const { type, id } = this.getUrlType();

    let tracksEndpoint = "";

    if (type === "playlist") {
      tracksEndpoint = `/playlists/${id}`;

      const results = await this.spotifyApi.get<Playlist>(tracksEndpoint);

      return results.data;
    } else if (type === "album") {
      tracksEndpoint = `/albums/${id}`;

      const results = await this.spotifyApi.get<Album>(tracksEndpoint);
      return results.data;
    } else {
      throw new Error(
        "Unsupported URL. Only playlist and album URLs are supported.",
      );
    }
  }

  async searchYoutube({ title, artist, albumName }: SeachParams) {
    const searchresults = await yts.search(
      `${albumName} ${title} ${artist} ${albumName && "Album"}`
        .trim()
        .toLowerCase(),
    );

    console.log(searchresults);

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
    const { name, tracks } = await this.getTracks();

    const urls: (string | null)[] = [];

    for (const [index, item] of tracks.items.entries()) {
      const { type } = this.getUrlType();

      let title = "";
      let artist = "";
      let albumName = "";

      if (type === "playlist") {
        const playlistItem = item as PlaylistItem;
        title = playlistItem.track.name;
        artist = this.getArtistNames(playlistItem.track.artists);
      } else if (type === "album") {
        const albumItem = item as AlbumItem;
        title = albumItem.name;
        artist = this.getArtistNames(albumItem.artists);
        albumName = name;
      }

      // Delay before making the request
      await delay(200 + Math.random() * 800);
      const spinner = createSpinner(
        `${index + 1}/${tracks.items.length} ${title} by ${artist}`,
      ).start();

      const url = await this.searchYoutube({
        title,
        artist,
        albumName,
      });

      if (url) {
        spinner.success();
        urls.push(url);
      } else {
        spinner.error({
          text: `${title} by ${artist} not found`,
        });
      }
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
          videos: urls,
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
