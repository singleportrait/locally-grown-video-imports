# Locally Grown TV Video Imports

This script uses the Babel CLI to upload Youtube videos to Contentful via the command line.

In order to import new videos:
- Update `data.csv` with a list of Youtube URLs
  - *Note: Limit the list to 50 entries, as that's Youtube's limit for one upload. In the future the code can parse and break those up into multiple API calls*
  - *Note: This supposedly checks whether a video is `embeddable`, though I haven't tested that functionality*
- Run `npx babel-node videoImport` in the console
- Check the admin to make sure all videos uploaded to Contentful successfully!
  - *Note: Currently there are no warnings if a video is not found on Youtube*

What `videoImport.js` does:
- Uses local environment variables for the Youtube & Contentful Management API keys
- Parses a CSV file `data.csv`
  - With 1 column, `youtubeUrl`
- Pings the Youtube API to get the video's duration and title
- Uploads each video as a new entry to Contentful, and publishes it

Helpful resources:
- [Google API Credentials admin](https://console.developers.google.com/apis/credentials?authuser=1&project=locally-grown-video-imports&supportedpurview=project)
- [Importing CSV data into Contentful](https://fabiofranchino.com/blog/import-csv-data-into-contentful/)
- [Sample Babel script CSV upload to Contentful](https://gist.github.com/grncdr/9458c230ac838d73a559)
- [Working with Youtube video durations](https://stackoverflow.com/questions/15596753/how-do-i-get-video-durations-with-youtube-api-version-3)
