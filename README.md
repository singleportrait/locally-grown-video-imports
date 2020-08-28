# Locally Grown TV Video Imports

This:
- Uses the Babel CLI to run the script via the command line

videoImport.js will:
- Parse a CSV file `data.csv`
  - With 1 column, `youtubeUrl`
- Ping the Youtube API to get the video's duration and title
- Upload each video as a new entry to Contentful
