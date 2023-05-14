import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import fs from "fs";
import yts from "yt-search";
import { createSpinner } from "nanospinner";
import {
  Album,
  AlbumItem,
  ExtractOptions,
  Playlist,
  PlaylistItem,
} from "./types";
import path from "path";
import shortUUID from "short-uuid";
import { removeDuplicates } from "./utils";

type UrlType = "playlist" | "album";

type SeachParams = {
  title: string;
  artist: string;
  albumName: string;
};

type PipedBookmarks = {
  format: "Piped";
  version: 1;
  playlists: {
    name: string;
    type: "playlist";
    visibility: "private";
    videos: string[];
  }[];
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
    const url = this.options.playlistUrl;
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
      `${albumName} ${title} by ${artist} ${albumName && "Topic"}`.trim(),
    );

    if (searchresults.videos.length === 0) {
      return null;
    }

    return searchresults.videos[0].url;
  }

  getArtistNames(artists: { name: string }[]) {
    return artists.reduce((acc, curr) => {
      return acc + curr.name + " ";
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

    const playlistName = this.options.playlistName || name;

    // Template
    const pipedBookmarks: PipedBookmarks = {
      format: "Piped",
      version: 1,
      playlists: [
        {
          name: playlistName,
          type: "playlist",
          visibility: "private",
          videos: removeDuplicates(urls),
        },
      ],
    };

    this.saveFile(pipedBookmarks);
  }

  async saveFile(bookmarks: PipedBookmarks) {
    const fileName = this.options.fileName;
    const destinationPath = this.options.destinationPath;
    const filePath = path.resolve(
      process.cwd(),
      destinationPath,
      `${this.options.fileName}.json`,
    );

    // Check if the file already exists
    const fileExists = fs.existsSync(filePath);

    // Append the timestamp to the filename if the file already exists
    const newFileName =
      (fileExists ? `${fileName}-${shortUUID.generate()}` : fileName) + ".json";
    const newFilePath = path.resolve(
      process.cwd(),
      destinationPath,
      newFileName,
    );

    // Save pipedBookmarks to file
    fs.writeFileSync(newFilePath, JSON.stringify(bookmarks), {
      // create the file if it doesn't exist, or overwrite the file if it already exists.
      flag: fs.existsSync(filePath) ? "w" : "wx",
    });

    createSpinner("Piped bookmarks successfully created").success();
    createSpinner(newFileName).success();
  }
}

export default Extractor;
