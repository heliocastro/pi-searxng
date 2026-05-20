import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const SEARXNG_URL = "http://search.zvn.oreskovic.me";

interface SearXNGResult {
	title: string;
	url: string;
	content?: string;
	publishedDate?: string;
	engines?: string[];
	score?: number;
}

interface SearXNGResponse {
	results: SearXNGResult[];
	answers?: Array<{ answer: string }>;
	infoboxes?: Array<{ infobox: string; content: string }>;
	suggestions?: string[];
	corrections?: string[];
}

const CATEGORIES = [
	"general", "web", "news", "images", "videos", "science",
	"scientific publications", "it", "packages", "repos", "q&a",
	"social media", "software wikis", "map", "weather", "translate",
	"dictionaries", "define", "music", "files", "wikimedia",
] as const;

export default function searxngExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "web_search",
		label: "SearXNG",
		description: `Search the web via a self-hosted SearXNG instance aggregating multiple engines.

Available categories (comma-separated for multiple):
- general / web — broad web search (google, brave, duckduckgo, startpage)
- news       — bing news, google news, reuters, yahoo news
- it         — stackoverflow, mdn, github, pypi, docker hub, arch wiki, askubuntu
- science    — arxiv, pubmed, google scholar, semantic scholar
- scientific publications — arxiv, pubmed, semantic scholar
- packages   — pypi, docker hub, hoogle
- repos      — github
- q&a        — stackoverflow, askubuntu, superuser
- images     — google images, bing images, unsplash, pexels, flickr
- videos     — youtube, vimeo, dailymotion
- social media — mastodon, lemmy
- software wikis — arch linux wiki, gentoo wiki
- map        — openstreetmap
- weather    — wttr.in (structured weather data)
- translate  — lingva, dictzone
- dictionaries / define — wiktionary, wordnik, etymonline
- music      — bandcamp, soundcloud, youtube
- files      — piratebay, solidtorrents
- wikimedia  — wiktionary, wikinews`,
		promptSnippet: "Search the web with SearXNG (self-hosted, multi-engine aggregator)",
		parameters: Type.Object({
			query: Type.String({ description: "Search query. Supports engine-specific syntax (e.g. site:, filetype:)." }),
			categories: Type.Optional(Type.String({
				description: 'Category or comma-separated categories (default: "general"). See tool description for full list.',
			})),
			language: Type.Optional(Type.String({
				description: 'Language code for results, e.g. "en", "hr", "de" (default: instance setting)',
			})),
			timeRange: Type.Optional(Type.String({
				description: 'Recency filter: "day", "month", or "year"',
			})),
			page: Type.Optional(Type.Integer({
				description: "Page number for more results (default: 1)",
			})),
			engines: Type.Optional(Type.String({
				description: 'Comma-separated engines to use, e.g. "google,duckduckgo,github". Overrides category defaults.',
			})),
			numResults: Type.Optional(Type.Integer({
				description: "Max results to return (default: 10, max: 20)",
			})),
		}),
		async execute(_toolCallId, params, signal) {
			const url = new URL(`${SEARXNG_URL}/search`);
			url.searchParams.set("q", params.query);
			url.searchParams.set("format", "json");
			url.searchParams.set("categories", params.categories ?? "general");
			if (params.language) url.searchParams.set("language", params.language);
			if (params.timeRange) url.searchParams.set("time_range", params.timeRange);
			if (params.page && params.page > 1) url.searchParams.set("pageno", String(params.page));
			if (params.engines) url.searchParams.set("engines", params.engines);

			const res = await fetch(url.toString(), { signal });
			if (!res.ok) throw new Error(`SearXNG error: ${res.status} ${res.statusText}`);

			const data = (await res.json()) as SearXNGResponse;
			const limit = Math.min(params.numResults ?? 10, 20);
			const results = data.results.slice(0, limit);

			const lines: string[] = [];

			if (data.answers?.length) {
				lines.push(`**Answer:** ${data.answers[0].answer}\n`);
			}

			if (data.infoboxes?.length) {
				const box = data.infoboxes[0];
				lines.push(`**${box.infobox}:** ${box.content}\n`);
			}

			if (data.corrections?.length) {
				lines.push(`**Did you mean:** ${data.corrections.join(", ")}\n`);
			}

			for (let i = 0; i < results.length; i++) {
				const r = results[i];
				const engines = r.engines?.length ? ` _(${r.engines.join(", ")})_` : "";
				const score = r.score != null ? ` [score: ${r.score.toFixed(2)}]` : "";
				const date = r.publishedDate ? ` · ${r.publishedDate.slice(0, 10)}` : "";
				lines.push(`${i + 1}. **${r.title}**${date}${engines}${score}`);
				lines.push(`   ${r.url}`);
				if (r.content) lines.push(`   ${r.content.slice(0, 400)}`);
				lines.push("");
			}

			if (data.suggestions?.length) {
				lines.push(`**Related searches:** ${data.suggestions.slice(0, 5).join(" · ")}`);
			}

			const text = lines.join("\n").trim() || "No results found.";
			return { content: [{ type: "text", text }] };
		},
	});
}
