import {
  Client,
  FollowingTimeline,
  HomeTimeline,
  ListTimeline,
  MediaTimeline,
  PostsTimeline,
  RepliesTimeline,
  RawTweetData,
  Tweet,
  TweetTypes,
} from "../src";
import fs from "fs";

// TODO: Fix how timelines handle cursors

const client = new Client({
  headless: true,
  keepPageOpen: false,
});

client.on("ready", async () => {
  
  // // create home timeline
  // const home = await client.timelines.fetch({
  //   type: 'home'
  // }) as HomeTimeline

  // // create following timeline
  // const following = await client.timelines.fetch({
  //   type: 'following'
  // }) as FollowingTimeline

  // // create list timeline with id '1239948255787732993'
  // const list = await client.timelines.fetch({
  //   type: 'list',
  //   id: '1239948255787732993'
  // }) as ListTimeline

  // create posts timeline without a profile
  const elonPosts = (await client.timelines.fetch({
    type: "posts",
    username: "elonmusk",
  })) as PostsTimeline;

  // listen for tweets
  elonPosts.on("timelineUpdate", async (tweets: Tweet<RawTweetData>[]) => {
    console.log("------------------------------------------")
    console.log("------------------------------------------")
    console.log("------------------------------------------")
    console.log(tweets.map((t) => t.text).join("\n"));
    console.log("------------------------------------------")
    console.log("------------------------------------------")
    console.log("------------------------------------------")
  });

  // stream posts timeline
  elonPosts.stream({
    minTimeout: 1 * 60 * 1000, // 1 minute
    maxTimeout: 2 * 60 * 1000, // 2 minutes
    catchUp: true,
    minCatchUpTimeout: 10 * 1000, // 10 seconds
    maxCatchUpTimeout: 20 * 1000, // 20 seconds
    maxCatchUpLoops: 5,
    isCatchUpComplete: (tweets) => {
      return false; // rely on maxCatchUpLoops
    },
  });

  // create profile for elon musk
  const elon = await client.profiles.fetch({
    username: "elonmusk",
  });

  // // create replies timeline through profile
  // const elonReplies = await elon.timelines.fetch('replies') as RepliesTimeline

  // // create media timeline through profile
  // const elonMedia = await elon.timelines.fetch('media') as MediaTimeline

  // // stream media timeline
  // elonMedia.stream({
  //   minTimeout: 1*60*1000,
  //   maxTimeout: 2*60*1000,
  //   catchUp: true,
  //   minCatchUpTimeout: 10*1000,
  //   maxCatchUpTimeout: 20*1000,
  //   maxCatchUpLoops: 5
  // }, async (data) => { // log media urls
  //   console.log(data.tweets.map( 
  //     t => t.media?.map(m => m.url).join(" | ") || 'No media found'
  //   ).join('\n'))
  // })
});
