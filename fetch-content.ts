import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

function htmlToText(html: string): string {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<(nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/?(p|div|section|article|h[1-6]|li|tr|blockquote)[^>]*>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&[a-z]+;/gi, " ")
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export default function fetchContentExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "fetch_content",
		label: "Fetch Content",
		description: "Fetch a URL and return its readable text content. Strips navigation, scripts, and styling — useful for reading articles, documentation, or any web page in full after finding it via search.",
		promptSnippet: "Fetch and read the text content of a web page",
		parameters: Type.Object({
			url: Type.String({ description: "URL to fetch" }),
			maxChars: Type.Optional(Type.Integer({
				description: "Maximum characters to return (default: 8000, max: 32000)",
			})),
		}),
		async execute(_toolCallId, params, signal) {
			const limit = Math.min(params.maxChars ?? 8000, 32000);

			const res = await fetch(params.url, {
				signal,
				headers: { "User-Agent": "Mozilla/5.0 (compatible; pi-agent/1.0)" },
			});

			if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

			const contentType = res.headers.get("content-type") ?? "";

			let text: string;
			if (contentType.includes("text/html")) {
				const html = await res.text();
				text = htmlToText(html);
			} else {
				text = await res.text();
			}

			const truncated = text.length > limit;
			const output = text.slice(0, limit);

			return {
				content: [{
					type: "text",
					text: truncated ? `${output}\n\n[truncated — ${text.length} chars total, showing first ${limit}]` : output,
				}],
			};
		},
	});
}
