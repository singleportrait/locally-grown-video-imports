// Importing videos from CSV, getting info from Youtube, and uploading to Contentful programmatically

import dotenv from 'dotenv';
import contentful from 'contentful-management';
import fs from 'fs'; // Node Filestream API
import parse from 'csv-parse';
import fetch from 'node-fetch';

dotenv.config();


/* Define Youtube regexp with all useful capture groups
 * I got this regexp from this stack overflow:
 * https://stackoverflow.com/questions/19377262/regex-for-youtube-url
 *
 * The captured groups are:
 * 1. protocol * 2. subdomain * 3. domain
 * 4. path * 5. video ID code * 6. query string
 */
const youtubeRegexp = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;


/* Import and parse CSV
 *
 * 1 column: videoUrl
 * Future: Allow CSV to include a custom timestamp start time?
 * Create list of simplified video IDs using regexp (stripping out any query params)
 *
 * Potential video URL formats:
 * https://www.youtube.com/watch?v=7ZAYzLjQAd4
 * https://www.youtube.com/watch?v=W-6v7IkfYKE&list=PLE2406712A8240C1F&index=13
 */
const streamFile = new Promise((resolve, reject) => {
  console.log("Running parser...");
  const parser = parse({columns: true});

  let rows = [];

  const stream = fs.createReadStream('data.csv')
    .pipe(parser)
    .on('data', (row) => {
      rows.push(row);
    })
    .on('error', (err) => {
      reject(err.message)
    })
    .on('end', () => {
      console.log("CSV data:", rows);

      const videoIDs = rows.map(row => {
        const url = row.youtubeUrl.match(youtubeRegexp);
        return url[5];
      });

      console.log("Video IDs:", videoIDs);
      resolve(videoIDs);
    });
});


/* Make Youtube API request
 *
 * TODO: You can only put 50 video IDs in the request at once, so we need to split up the video IDs array if it's longer than 50
 * Docs: https://developers.google.com/youtube/v3/docs/videos?authuser=1
 * Sample: https://www.googleapis.com/youtube/v3/videos?id=9bZkp7q19f0,7ZAYzLjQAd4&part=contentDetails,snippet&key={YOUR_API_KEY}
 * - contentDetails.duration
 *   - This is in format PT#H#M#S; if it's < 1 hour, it's PT#M#S
 *   - Doesn't have a zero before the duration, e.g. PT7M3S
 *   - Need to turn into format (HH:)MM:SS
 * - snippet.title
 * Maybe: Check whether it's embeddable?
 * - status.embeddable
 * If it doesn't find the video, Youtube just doesn't return data for it
 * Return an object
 */
async function queryYoutube(videoIDs) {
  console.log("Requesting Youtube info for videos...");

  const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoIDs.join()}&part=contentDetails,snippet,status&key=${process.env.YOUTUBE_API_KEY}`;

  const response = await fetch(youtubeApiUrl)
  const json = await response.json();

  const durationRegexp = /PT((?<hours>[0-9]+)H)*((?<minutes>[0-9]+)M)*(?<seconds>[0-9]+)S/;

  const processedVideos = json.items.map(video => {
    if (!video.status.embeddable) {
      console.log("This video isn't embeddable:", video.snippet.title);
      return false;
    }

    const result = video.contentDetails.duration.match(durationRegexp);

    const { hours, minutes, seconds } = result.groups;

    let durationSegments = [];

    if (hours) { durationSegments.push(hours); }

    // If minutes OR if no minutes, process (e.g. edge case: 1h 33s)
    durationSegments.push(minutes || '0');

    // If seconds OR if no seconds, process (e.g. 24s; 9m)
    // Subtracting 1 second because Youtube calculates duration weirdly!
    // This is a known issue within the Contentful admin, too
    durationSegments.push((seconds-1).toString() || '0');

    const processedDuration = durationSegments.map(number => number.padStart(2, '0')).join(":");

    const processedVideo = {
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      length: processedDuration
    }
    return processedVideo;
  });

  console.log("Youtube API data parsed for uploading to Contentful:");
  console.log(processedVideos);

  return processedVideos;
}


/* Connect to Contentful Management API
 *
 * Set up management token
 * Upload videos one at a time
 * Using createEntry
 * With video model
 * https://www.contentful.com/developers/docs/references/content-management-api/#/reference/entries/entries-collection/create-an-entry/console/js
 * Catch errors if it doesn't upload properly
 */
async function uploadToContentful(videos) {
  const client = contentful.createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_API_KEY
  })
  const space = await client.getSpace('erbmau6qmrq2');
  const environment = await space.getEnvironment('master');

  console.log("Uploading to Contentful...");

  for (const video of videos) {
    await environment.createEntry('video', {
      fields: {
        title: {
          'en-US': video.title
        },
        url: {
          'en-US': video.url
        },
        length: {
          'en-US': video.length
        }
      }
    })
    .then((entry) => entry.publish())
    .then((entry) => console.log(`Entry ${entry.sys.id} (${entry.fields.title['en-US']}) created & published.`))
    // .then((entry) => console.log(entry))
    .catch(console.error)
  };
}


/* Run the scripts! */
(async () => {
  try {
    const videoIDs = await streamFile;
    const processedVideos = await queryYoutube(videoIDs);
    await uploadToContentful(processedVideos);
    console.log("Finished!");
  } catch(err) {
    console.log("Errors:");
    console.log(err);
  }
})();
