import { serve } from "@upstash/workflow/nextjs";
import { WorkflowTool } from "@upstash/workflow";
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

type IdeogramResponse = {
  created: string;
  data: Array<{
    prompt: string;
    url: string;
  }>;
};

export const { POST } = serve<{ prompt: string }>(
  async (context) => {
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
        twitterTool: new WorkflowTool({
          description:
            "A tool for generating an image and posting a tweet to Twitter. It takes an " +
            "object as a parameter with `tweet` and `imagePrompt` fields. The `tweet` field " +
            "contains the tweet to post which is a string, and the `imagePrompt` field contains " +
            "the prompt to generate an image for the tweet which is a string. You absolutely " +
            "should not give the strings directly as parameters.",
          schema: z.object({
            tweet: z.string().describe("The tweet to post."),
            imagePrompt: z
              .string()
              .describe("The prompt to generate an image for the tweet."),
          }),
          invoke: async ({
            tweet,
            imagePrompt,
          }: {
            tweet: string;
            imagePrompt: string;
          }) => {
            const { body: ideogramResult } =
              await context.call<IdeogramResponse>(
                "call image generation API",
                {
                  url: "https://api.ideogram.ai/generate",
                  method: "POST",
                  body: {
                    image_request: {
                      model: "V_2",
                      prompt: imagePrompt,
                      aspect_ratio: "ASPECT_16_9",
                      magic_prompt_option: "AUTO",
                      style_type: "DESIGN",
                      color_palette: {
                        members: [
                          { color_hex: "#FF6D00" },
                          { color_hex: "#FFCA12" },
                          { color_hex: "#58BAE7" },
                          { color_hex: "#DDDDDD" },
                        ],
                      },
                    },
                  },
                  headers: {
                    "Content-Type": "application/json",
                    "Api-Key": process.env.IDEOGRAM_API_KEY!,
                  },
                }
              );

            const twitterResult = context.run(
              "post image to Twitter",
              async () => {
                const client = new TwitterApi({
                  appKey: process.env.TWITTER_CONSUMER_KEY!,
                  appSecret: process.env.TWITTER_CONSUMER_SECRET!,
                  accessToken: process.env.TWITTER_ACCESS_TOKEN,
                  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
                }).readWrite;
                const blob = await fetch(ideogramResult.data[0].url).then(
                  (res) => res.blob()
                );
                const arrayBuffer = await blob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mediaId = await client.v1.uploadMedia(buffer, {
                  mimeType: "image/jpeg",
                });
                await client.v2.tweet(tweet, {
                  media: { media_ids: [mediaId] },
                });
                return tweet;
              }
            );
            return twitterResult;
          },
          executeAsStep: false,
        }),
      },
      background:
        "You are an AI assistant that helps people stay up-to-date with the latest news. " +
        "You can fetch the top 1 unvisited Hacker News article and post it to Twitter " +
        "using the `hackerNewsTool` and `twitterTool` tools respectively. You will be " +
        "called every hour to fetch a new article and post it to Twitter. You must create " +
        "a 250 character tweet summary of the article. Provide links in the tweet if " +
        "possible. Make sure to generate an image related to the tweet and post it along " +
        "with the tweet.",
    });

    const task = context.agents.task({
      agent: hackerNewsTwitterAgent,
      prompt:
        "Fetch the top 1 unvisited Hacker News article and post it to Twitter. Generated image will be posted " +
        "to Twitter with the tweet so it should be related to the tweet. Sometimes the articles are " +
        "written in first person, so make sure to change the first person to third person point of view in tweet. " +
        "Do not change the urls in the tweet. Do not post inappropriate content in tweet or " +
        "image. Make sure the tweet is short and concise, has no more than 250 characters. Generate " +
        "a visually appealing illustration related to the article. The image " +
        "should be clean, simple, and engaging—ideal for social media scrolling. Use an isometric " +
        "or minimal flat design style with smooth gradients and soft shadows. Avoid clutter, excessive " +
        "details, or small text. If the image includes arrows or lines, make them slightly thick and " +
        "black for clarity. Do not include logos or branding. The illustration should convey the article’s " +
        "theme in a creative and inviting way. Try to give a concrete description of the image. In the " +
        "tweet, make sure to put the url of the article two lines below the tweet, with Check it out " +
        "here or similar expression before it. Do not call a tool twice in parallel.",
    });

    await task.run();
  },
  {
    retries: 0,
  }
);
