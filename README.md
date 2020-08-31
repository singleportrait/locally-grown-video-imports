# Locally Grown TV Video Imports

This:
- Uses the Babel CLI to run the script via the command line

In order to import new videos:
- Update `data.csv` with a list of Youtube URLs
  - Note: Limit the list to 50 entries, as that's Youtube's limit for one upload. In the future the code can parse and break those up into multiple API pings
  - Note: This supposedly checks whether a video is `embeddable`, though I haven't found a video to rigorously test that with
- Run `npx babel-node videoImport` in the console
- Check to make sure all videos uploaded to Contentful successfully!
  - Note: Currently there are no warnings if a video is not found on Youtube

videoImport.js will:
- Use local environment variables for the Youtube & Contentful Management API keys
- Parse a CSV file `data.csv`
  - With 1 column, `youtubeUrl`
- Ping the Youtube API to get the video's duration and title
- Upload each video as a new entry to Contentful, and publish it

Helpful resources:
- [Google API Credentials admin](https://console.developers.google.com/apis/credentials?authuser=1&project=locally-grown-video-imports&supportedpurview=project)
- [Importing CSV data into Contentful](https://fabiofranchino.com/blog/import-csv-data-into-contentful/)
- [Sample Babel script CSV upload to Contentful](https://gist.github.com/grncdr/9458c230ac838d73a559)
