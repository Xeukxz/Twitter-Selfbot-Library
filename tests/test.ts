import { Client, TweetBasedTimeline, Tweet } from "..";
import fs from 'fs';

console.log("Starting example...");

if (!fs.existsSync('tests/out')) fs.mkdirSync('tests/out');

const client = new Client({
  headless: true, // If the puppeteer browser should be visible or not.
  puppeteerSettings: {
    // Puppeteer launch settings
    // args: ['--no-sandbox', '--disable-setuid-sandbox'], // for some linux environments (see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox)
  },
  // debug: true
});

client.on("ready", () => {
  streamNotifications();
  streamTimelines();
});

async function streamTimelines() {
  const streamList: TweetBasedTimeline[] = [];

  // create home timeline
  const home = await client.timelines.fetch({
    type: 'home',
  });
  streamList.push(home);

  // create following timeline
  const following = await client.timelines.fetch({
    type: 'following',
  });
  streamList.push(following);

  // create list timeline with id '1239948255787732993'
  const list = await client.timelines.fetch({
    type: 'list',
    id: '1632543657965363200',
  });
  streamList.push(list);
  
  // create tweet and get replies timeline
  const tweet = await client.tweets.fetch('1825723913051000851');
  const tweetReplies = await tweet.replies;
  streamList.push(tweetReplies);

  // create posts timeline without a profile
  const elonPosts = await client.timelines.fetch({
    type: 'posts',
    username: 'elonmusk',
  });
  streamList.push(elonPosts);

  // // stop streaming after 60 seconds
  // setTimeout(() => {
  //   elonPosts.endStream();
  // }, 1 * 60 * 1000);

  // create profile for elon musk
  const elon = await client.profiles.fetch({
    username: 'elonmusk',
  });

  // create replies timeline through profile
  const elonReplies = await elon.timelines.fetch('replies');
  streamList.push(elonReplies);

  // create media timeline through profile
  const elonMedia = await elon.timelines.fetch('media');
  streamList.push(elonMedia);

  // create search timeline
  const searchResults = await client.search({
    exactPhrases: ['test'],
  });
  streamList.push(searchResults);

  streamAll(streamList);
};

function streamNotifications() {
  client.on('unreadNotifications', async (notifications) => {
    console.log('Unread Notifications:', notifications.length, 'total:', client.notifications.all.notifications.length);
    notifications.forEach(async (notif) => { // log the media in tweets you are mentioned in
      const tweet = notif.tweet
      if(notif.isMention()) console.log(!!tweet.media?.length ? tweet.media : 'no media');
    })

    fs.writeFileSync('tests/out/notifications.txt', client.notifications.all.notifications.map(n => `${n.type} - ${n.tweet ? n.tweet.text?.replace(/\n/g, ' ') : 'no tweet/text'}`).join('\n'));
  })

  // check for new notifications every 10 seconds
  client.notifications.stream(10000);
  fs.writeFileSync('tests/out/notifications.txt', client.notifications.all.notifications.map(n => `${n.type} - ${n.tweet ? n.tweet.text?.replace(/\n/g, ' ') : 'no tweet/text'}`).join('\n'));
};

client.on('timelineCreate', async (timeline) => {
  console.log('Timeline Created:', timeline.type); // 'home' | 'following' | 'list' | 'posts' | 'media' | 'replies' | 'tweetReplies' | 'search'
  console.log(timeline.tweets.cache.length, 'tweets cached');
  
  writeTimelinesToFile(client.timelines.cache);
});

client.on('profileCreate', async (profile) => {
  console.log('Profile Created:', profile.username);
});

function streamAll(timelines: TweetBasedTimeline[]) {
  timelines.forEach((timeline) => { // stream each timeline and log new tweets
    // manage new tweets
    timeline.on('timelineUpdate', async (tweets: Tweet[]) => {
      console.log(`Timeline Update [${timeline.type}]:`, tweets.length, 'new tweets');
      // console.log("--------------- NEW TWEETS --------------");
      // console.log(tweets.map(t => `${t.createdAt} - ${t.isRetweet ? t.retweetedTweet?.text : t.text}`).join("\n"));
      // console.log("------------------------------------------");
      // console.log(`${client.timelines.cache.reduce((acc, timeline) => acc + timeline.tweets.cache.length, 0)} total tweets cached`);

      writeTimelinesToFile(timelines);
    });

    // stream the timeline
    timeline.stream({
      minTimeout: 1 * 60 * 1000,
      maxTimeout: 2 * 60 * 1000,
      catchUp: true,
      minCatchUpTimeout: 10 * 1000,
      maxCatchUpTimeout: 20 * 1000,
      maxCatchUpLoops: 5,
    });
  });
};

function writeTimelinesToFile(timelines: TweetBasedTimeline[]) {
  fs.writeFileSync(`tests/out/timelines.txt`, timelines.map(tl => `
##
##  ${tl.type.toUpperCase()}
##

${tl.tweets.cache.map(t => `${t.createdAt} - ${t.isRetweet ? t.retweetedTweet?.text : t.text}`.replace(/\n/g, '\\n')).join('\n')}`).join('\n\n'));
}