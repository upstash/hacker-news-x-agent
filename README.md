# Hacker News X Agent with Workflow

This is a simple agent that fetches the top stories from Hacker News and tweets a summary. Agent orchestration is done using `@upstash/workflow` agents.

To see the agent in action, follow [@hackernewsagent](https://x.com/hackernewsagent) on X.

To learn more about how the agent works, check out our [blog post](https://upstash.com/blog/hackernewsagent).

## Setup Instructions

### Using the Vercel Deploy Button

You can deploy this agent to Vercel with a single click using the Vercel Deploy Button found found at the top of this file. Fill the environment variables as described in the next steps.

### Fill Environment Variables

1. Clone this repository.

```bash
git clone https://github.com/upstash/hacker-news-x-agent.git
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env.local` file in the root directory and copy the contents from `.env.local.example`. Fill these environment variables following the instructions in the next steps.

4. Go to [QStash tab on Upstash Console](https://console.upstash.com/qstash). Fill the following environment variables in `.env.local` with the values found in the **Environment Keys** section:

```bash
# To power the workflow
QSTASH_TOKEN=

# To make sure requests are coming from the right source
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

5. Go to [Redis tab on Upstash Console](https://console.upstash.com/redis). Create a new Redis database and fill the following environment variables in `.env.local` with the values found in the **REST API** section `.env` tab:

```bash
# To keep track of the news articles visited
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

6. Go to [OpenAI Platform -> API Keys](https://platform.openai.com/api-keys) and create a new API key. Fill the following environment variables in `.env.local`:

```bash
# To power the agent
OPENAI_API_KEY=
```

<details>
  <summary>7. Set up X API</summary>

1. Go to [X Website](https://x.com/) and create an account.

**1-create-x-account.png**

2. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard) and sign up for a a free developer account.

**2-create-x-developer-account.png**

3. Fill the developer agreement & policy according to your needs.

**3-fill-developer-policy.png**

4. Go to project settings.

**4-go-project-settings.png**

5. Set up User authentication settings.

**5-set-up-user-auth-settings.png**

6. Fill the form and save.

**6-user-auth-settings-form-pat-1.png**

**7-user-auth-settings-form-pat-2.png**

7. Make sure User authentication is set up.

**8-check-user-auth-settings-set-up.png**

8. Fill the following environment variables in `.env.local` with the values found under the **Keys and tokens** tab:

```bash
# To be able to tweet
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
```

**9-keys-and-tokens.png**

</details>

### Deploy the Agent

1. Deploy the agent to Vercel.

```bash
vercel
```

2. Go to the Vercel Dashboard -> Your Project -> Environment Variables and paste the contents of `.env.local` there, you don't need to set them one by one.

3. Deploy the agent to production.

```bash
vercel --prod
```

### Calling the Agent

1. To secure the calls to the agent, only requests signed by QStash are allowed.
   If you don't want this security layer, you can just leave the following environment variables empty. You can learn more about how to [Secure an endpoint with our guide](https://upstash.com/docs/workflow/howto/security).

```bash
# To make sure requests are coming from the right source
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

2. Go to [QStash tab on Upstash Console](https://console.upstash.com/qstash) and publish a message.

**11-qstash-publish.png**

### Schedule the Agent

1. Go to [QStash tab on Upstash Console](https://console.upstash.com/qstash) and create a new schedule with Request Builder. Keep the limits of X API and QStash in mind while setting the schedule frequency. Cron expression `0 */2 * * *` will run the agent every 2 hours.

**10-qstash-schedule.png**

### Local Development

1. Check out our [Local Development Guide](https://upstash.com/docs/workflow/howto/local-development) to learn how to work with `@upstash/workflow` agents locally.

2. You can run the agent locally with the following command:

```bash
npm run dev
```
