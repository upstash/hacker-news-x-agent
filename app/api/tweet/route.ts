import { serve } from "@upstash/workflow/nextjs";
import { Redis } from "@upstash/redis";

import { HackerNewsClient } from "@agentic/hacker-news";
import { TwitterApi } from "twitter-api-v2";

import * as cheerio from "cheerio";
import { z } from "zod";
import { tool } from "ai";

import {
  TOP_SLICE,
  SELECTORS_TO_REMOVE,
  MAX_CONTENT_LENGTH,
} from "@/app/constants";

export const { POST } = serve<{ prompt: string }>(async (context) => {
  const model = context.agents.openai("gpt-4o-mini");

  const hackerNewsTwitterAgent = context.agents.agent({
    model,
    name: "hackerNewsTwitterAgent",
    maxSteps: 2,
    tools: {
      hackerNewsTool: tool({
        description:
          "A tool for fetching the top 1 unvisited Hacker News article. It returns an " +
          "object with the title, url, and content of the article. It does not take any " +
          "parameters, so give an empty object as a parameter. You absolutely should not " +
          "give an empty string directly as a parameter.",
        parameters: z.object({}),
        execute: async ({}) => {
          const redis = Redis.fromEnv();
          const hn = new HackerNewsClient();
          const top100 = (await hn.getTopStories()).slice(0, TOP_SLICE);
          const top1Unvisited =
            top100[
              (await redis.smismember("visited", top100)).findIndex(
                (v) => v === 0
              )
            ];
          await redis.sadd("visited", top1Unvisited);
          const item = await hn.getItem(top1Unvisited);
          const title = item.title;
          const url = item.url;

          if (!url) {
            return {
              title,
              url,
              content: "",
            };
          }

          const html = await fetch(url).then((res) => res.text());

          const $ = cheerio.load(html);

          SELECTORS_TO_REMOVE.forEach((selector) => {
            $(selector).remove();
          });

          let $content = $('main, article, [role="main"]');

          if (!$content.length) {
            $content = $("body");
          }

          const content = $content
            .text()
            .replace(/\s+/g, " ")
            .replace(/\n\s*/g, "\n")
            .trim()
            .slice(0, MAX_CONTENT_LENGTH);

          return {
            title,
            url,
            content,
          };
        },
      }),
      twitterTool: tool({
        description:
          "A tool for posting a tweet. It takes an object as a parameter with a `tweet` " +
          "field that contains the tweet to post which is a string. You absolutely should " +
          "not give the string directly as a parameter.",
        parameters: z.object({
          tweet: z.string().describe("The tweet to post."),
        }),
        execute: async ({ tweet }: { tweet: string }) => {
          const v2Client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY!,
            appSecret: process.env.TWITTER_CONSUMER_SECRET!,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
          }).readWrite.v2;
          await v2Client.tweet(tweet);
          return tweet;
        },
      }),
    },
    background:
      "You are an AI assistant that helps people stay up-to-date with the latest news. " +
      "You can fetch the top 1 unvisited Hacker News article and post it to Twitter " +
      "using the `hackerNewsTool` and `twitterTool` tools respectively. You will be " +
      "called every hour to fetch a new article and post it to Twitter. You must create " +
      "a 250 character tweet summary of the article. Provide links in the tweet if " +
      "possible.",
  });

  const task = context.agents.task({
    agent: hackerNewsTwitterAgent,
    prompt:
      "Fetch the top 1 unvisited Hacker News article and post it to Twitter.",
  });

  await task.run();
});
