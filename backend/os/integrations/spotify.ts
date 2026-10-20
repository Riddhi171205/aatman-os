import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
});

// You must set the access token for the user before calling this!
export async function playTrack(accessToken: string, trackUri: string) {
    spotifyApi.setAccessToken(accessToken);
    await spotifyApi.play({ uris: [trackUri] });
}