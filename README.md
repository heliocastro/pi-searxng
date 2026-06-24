# @oresk/pi-searxng

Pi extension that adds a `web_search` tool backed by a self-hosted [SearXNG](https://docs.searxng.org/) instance — a privacy-respecting meta search engine aggregating results from multiple engines.

## Install

```bash
pi install @oresk/pi-searxng
```

## Configuration

Set the `SEARXNG_URL` environment variable to point to your SearXNG instance:

```bash
export SEARXNG_URL="https://search.yourdomain.com"
```

If not set, it defaults to `http://localhost:8080` (a local SearXNG instance).

### Setting up SearXNG

If you don't have a SearXNG instance yet, the easiest way is Docker:

```bash
docker run -d -p 8080:8080 \
  -e "SEARXNG_BASE_URL=http://localhost:8080/" \
  searxng/searxng
```

See the [SearXNG docs](https://docs.searxng.org/admin/installation-docker.html) for production setup.

## Available Categories

The tool supports all SearXNG engine categories:

| Category | Engines |
|----------|---------|
| `general` / `web` | Google, Brave, DuckDuckGo, Startpage |
| `news` | Bing News, Google News, Reuters, Yahoo News |
| `it` | StackOverflow, MDN, GitHub, PyPI, Docker Hub, Arch Wiki |
| `science` | arXiv, PubMed, Google Scholar, Semantic Scholar |
| `packages` | PyPI, Docker Hub, Hoogle |
| `repos` | GitHub |
| `q&a` | StackOverflow, AskUbuntu, SuperUser |
| `images` | Google Images, Bing Images, Unsplash, Pexels, Flickr |
| `videos` | YouTube, Vimeo, Dailymotion |
| `social media` | Mastodon, Lemmy |
| `software wikis` | Arch Linux Wiki, Gentoo Wiki |
| `map` | OpenStreetMap |
| `weather` | wttr.in |
| `translate` | Lingva, Dictzone |
| `dictionaries` / `define` | Wiktionary, Wordnik, Etymonline |
| `music` | Bandcamp, SoundCloud, YouTube |
| `files` | Pirate Bay, SolidTorrents |
| `wikimedia` | Wiktionary, Wikinews |

## License

MIT
