# n8n workflow — RSS → FLUX → Facebook + LinkedIn + TweackTech blog

Import `TweackTech-RSS-FLUX-Facebook-LinkedIn-Blog.json` into n8n. It is the original
"Topics RSS -> Filter -> FLUX image -> Facebook + LinkedIn (Tech/AI)" workflow with two
extra nodes wired into the **Tech/AI (logo)** branch:

1. `Blog: Pick First Image` — FLUX returns one item per generated image; this keeps only
   the first so one article produces one blog post.
2. `TweackTech: Publish Blog` — calls the TweackTech integration API with the article
   title, summary, hashtags, source link and the generated image (as a base64 data URL).

The existing Facebook and LinkedIn posting chain is unchanged.

## Required n8n environment variables

Set these in n8n (Settings → Environment Variables, or your n8n `.env`):

```env
TWEACKTECH_N8N_KEY=the-same-value-as-N8N_API_KEY-on-the-backend
TWEACKTECH_API_URL=https://tweacktech-api.vercel.app/api
CLOUDFLARE_API_TOKEN=<your Cloudflare API token>
```

The FLUX HTTP nodes now read the Cloudflare token from `CLOUDFLARE_API_TOKEN` instead of
hardcoding it in the workflow. Create a token with **Account → Workers AI:Edit** and add
it as an n8n environment variable.

`TWEACKTECH_API_URL` is optional; the default above is used when it is not set. For local
testing use `http://localhost:5001/api`.

The backend must have `N8N_API_KEY` set to the same value. If it is missing, the endpoint
returns `503`; if the key does not match, it returns `401`.

## What the endpoint receives

```json
{
  "title": "Selected RSS headline",
  "summary": "Filtered article summary",
  "content": "<p>Filtered article summary</p>",
  "featuredImage": "data:image/jpeg;base64,...",
  "tags": ["AI", "Tech"],
  "link": "https://original-source...",
  "isPublished": true
}
```

The API uploads the base64 image to Cloudinary and creates a published blog post. It shows
up on `/blog` and in the homepage "Fresh thinking in tech" section after the next frontend
build (prerendered share pages are generated at build time).

## Adding blog publishing to the general-news branch

The current file publishes from `Filter Tech/AI + Pick One` only. To also publish general
news items, copy `Blog: Pick First Image` and `TweackTech: Publish Blog`, connect them after
`Cloudflare FLUX Image5`, and change the article references in the HTTP node body from
`$('Filter Tech/AI + Pick One')` to `$('Filter + Pick One')`.

## Payload size note
The workflow stores a logo inside two Code nodes as base64. Large inline images can make
the n8n import API return **"request entity too large"**. Use the compact copy
(`TweackTech_-_RSS_FLUX_Facebook_LinkedIn_Blog_v2(1)_compact.json` in Downloads) where
that logo is replaced with a tiny 1×1 placeholder. The image-overlay nodes still run;
replace `LOGO_B64` with a short hosted logo string if you want the watermark back.

If a **413** happens when the workflow calls `/api/integrations/n8n/blog`, the generated
image is too large to send as a base64 data URL through Vercel (~4.5 MB request limit).
Send a hosted image URL in `featuredImage` instead, or compress the FLUX output before the
publish node.
