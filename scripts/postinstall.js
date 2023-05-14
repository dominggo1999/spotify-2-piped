import os from "os";
import fs from "fs";
import path from "path";

const authData = {
  SPOTIFY_CLIENT_ID: "",
  SPOTIFY_CLIENT_SECRET: "",
};

const spotifyFolderPath = path.join(os.homedir(), ".spotify-2-piped");
const spotifyAuthFilePath = path.join(spotifyFolderPath, "spotify-auth.json");

if (!fs.existsSync(spotifyFolderPath)) {
  fs.mkdirSync(spotifyFolderPath);
  console.log(".spotify-2-piped folder created");
}

if (!fs.existsSync(spotifyAuthFilePath)) {
  fs.writeFileSync(spotifyAuthFilePath, JSON.stringify(authData, null, 2));
  console.log("spotify-auth.json file created in .spotify-2-piped folder");
} else {
  console.log("spotify-auth.json file already exists");
}
