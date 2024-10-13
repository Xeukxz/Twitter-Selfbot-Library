import {
  Client,
  Timeline,
  Tweet,
} from "../src";

const client = new Client({
  headless: true,
});

client.on("ready", async () => {
  
  // // create home timeline
  // const home = await client.timelines.fetch({
  //   type: 'home'
  // })

  // // create following timeline
  // const following = await client.timelines.fetch({
  //   type: 'following'
  // })

  // // create list timeline with id '1239948255787732993'
  // const list = await client.timelines.fetch({
  //   type: 'list',
  //   id: '1239948255787732993'
  // })

  // create posts timeline without a profile
  const elonPosts = (await client.timelines.fetch({
    type: "posts",
    username: "elonmusk",
  }));

  // let tweet = await client.tweets.fetch("1825723913051000851")

  // // stream posts timeline
  // elonPosts.stream({
  //   minTimeout: 1 * 60 * 1000, // 1 minute
  //   maxTimeout: 2 * 60 * 1000, // 2 minutes
  //   catchUp: true,
  //   minCatchUpTimeout: 10 * 1000, // 10 seconds
  //   maxCatchUpTimeout: 20 * 1000, // 20 seconds
  //   maxCatchUpLoops: 5,
  //   isCatchUpComplete: (tweets) => {
  //     return false; // rely on maxCatchUpLoops
  //   },
  // });

  // // stop streaming after 60 seconds
  // setTimeout(() => {
  //   elonPosts.endStream();
  // }, 1*60*1000);

  // // create profile for elon musk
  // const elon = await client.profiles.fetch({
  //   username: "elonmusk",
  // });

  // // create replies timeline through profile
  // const elonReplies = await elon.timelines.fetch('replies')

  // // create media timeline through profile
  // const elonMedia = await elon.timelines.fetch('media')

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

  
  // stream timelines
  streamAll([
    // home,
    // following,
    // list,
    elonPosts,
    // elonReplies,
    // elonMedia,
    // await tweet.replies
  ])
});

client.on('timelineCreate', async (timeline) => {
  console.log('Timeline Created:', timeline.type) // 'list' || 'home' || 'following' || 'posts' || 'replies' || 'media'
  console.log(timeline.tweets.cache.length, 'tweets cached')
})

client.on('profileCreate', async (profile) => {
  console.log('Profile Created:', profile.username)
})

function streamAll(timelines: Timeline[]) {
  timelines.forEach(timeline => {

    // manage new tweets
    timeline.on('timelineUpdate', async (tweets: Tweet[]) => {
      console.log("--------------- NEW TWEETS --------------")
      console.log(tweets.map(t => `${t.createdAt} - ${t.isRetweet ? t.retweetedTweet?.text : t.text}`).join('\n'))
      console.log("------------------------------------------")
    })

    // stream the timeline
    timeline.stream({
      minTimeout: 1*60*1000,
      maxTimeout: 2*60*1000,
      catchUp: true,
      minCatchUpTimeout: 10*1000,
      maxCatchUpTimeout: 20*1000,
      maxCatchUpLoops: 5
    })
  })
}