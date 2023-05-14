import { type QuestionCollection } from "inquirer";
import { validateSpotifyLink } from "./validations";
import { ExtractOptions } from "./types";

type AnswersType = Omit<ExtractOptions, "accessToken">;

export const createPrompts = (): QuestionCollection<AnswersType> => {
  return [
    {
      type: "input",
      name: "playlistUrl",
      message: "Enter the playlist/album url: ",
      require: true,
      validate: validateSpotifyLink,
    },
    {
      type: "input",
      name: "destinationPath",
      message: "Enter the destination path: ",
      default: ".",
    },
    {
      type: "input",
      name: "fileName",
      message: "Enter the file name: ",
      default: "my-playlist",
    },
    {
      type: "input",
      name: "playlistName",
      message:
        "Enter the playlist name (default to the spotify playlist/album name) ",
      default: null,
      require: false,
    },
  ];
};
