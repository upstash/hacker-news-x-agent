# Hacker News X Agent with Workflow

This is a simple agent that fetches the top stories from Hacker News and tweets a summary. Agent orchestration is done using `@upstash/workflow` agents.

To see the agent in action, follow [@hackernewsagent](https://x.com/hackernewsagent) on X.

To learn more about how the agent works, check out our [blog post](https://upstash.com/blog/hacker-news-x-agent).

## Setup Instructions

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

7. Go to [ideogram](https://ideogram.ai/) and create a new API key. Fill the following environment variables in `.env.local`:

```bash
# To generate images
IDEOGRAM_API_KEY=
```

<details>
  <summary>8. Set up X API</summary>

1. Go to [X Website](https://x.com/) and create an account.

![1-create-x-account](https://github.com/user-attachments/assets/1b5275fa-fd88-426e-a505-ce5f463ab3fe)

2. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard) and sign up for a a free developer account.

![2-create-x-developer-account](https://github.com/user-attachments/assets/b71838b9-c859-4ecc-9c60-ddbae4e6733f)

3. Fill the developer agreement & policy according to your needs.

![3-fill-developer-policy](https://github.com/user-attachments/assets/5cf65b86-cba7-48db-bffb-94ada369e31f)

4. Go to project settings.

![4-go-project-settings](https://github.com/user-attachments/assets/64253f99-14e5-4ff4-9877-a0f10f0e0530)

5. Set up User authentication settings.

![5-set-up-user-auth-settings](https://github.com/user-attachments/assets/2e7ad140-72fa-484d-9223-7c34e4d8c488)

6. Fill the form and save.

![6-user-auth-settings-form-part-1](https://github.com/user-attachments/assets/930c6ff6-85f0-4291-aba3-17f4e011e9e9)

![7-user-auth-settings-form-part-2](https://github.com/user-attachments/assets/52e2a5f9-7113-484c-9b1e-d651abbacd0c)

7. Make sure User authentication is set up.

![8-check-user-auth-settings-set-up](https://github.com/user-attachments/assets/99783d73-8564-48fb-8e5a-3c5e7727ae38)

8. Fill the following environment variables in `.env.local` with the values found under the **Keys and tokens** tab:

```bash
# To be able to tweet
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
```

![9-keys-and-tokens](https://github.com/user-attachments/assets/7af449da-a41c-4991-975d-9cf562859000)

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

![11-qstash-publish](https://github.com/user-attachments/assets/391314ed-9bc3-4fba-9852-c85314bf6671)

### Schedule the Agent

1. Go to [QStash tab on Upstash Console](https://console.upstash.com/qstash) and create a new schedule with Request Builder. Keep the limits of X API and QStash in mind while setting the schedule frequency. Cron expression `0 */2 * * *` will run the agent every 2 hours.

![10-qstash-schedule](https://github.com/user-attachments/assets/fb23d03e-3faf-4738-b2aa-0fc694512b10)

### Local Development

1. Check out our [Local Development Guide](https://upstash.com/docs/workflow/howto/local-development) to learn how to work with `@upstash/workflow` agents locally.

2. You can run the agent locally with the following command:

```bash
npm run dev
```
