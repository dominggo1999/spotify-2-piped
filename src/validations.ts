export const validateSpotifyLink = async (input: string) => {
  const linkRegex =
    /^https:\/\/open\.spotify\.com\/(playlist|album)\/[a-zA-Z0-9]+$/;

  if (linkRegex.test(input)) {
    return true;
  } else {
    return "Please enter a valid Spotify link with the format: https://open.spotify.com/{playlist or album}/id";
  }
};
