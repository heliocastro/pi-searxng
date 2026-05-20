import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { Type } from "typebox";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export default function fetchContentExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "fetch_content",
		label: "Fetch Content",
		description: "Fetch a URL and return its readable text content as Markdown. Uses Mozilla Readability to extract the main article body — strips navigation, ads, and boilerplate. Useful for reading articles, documentation, or any web page in full after finding it via search.",
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
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
			});

			if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

			const contentType = res.headers.get("content-type") ?? "";

			let text: string;
			let title = "";

			if (contentType.includes("text/html")) {
				const html = await res.text();
				const { document } = parseHTML(html);
				const article = new Readability(document as unknown as Document).parse();

				if (article) {
					title = article.title;
					text = turndown.turndown(article.content);
				} else {
					text = document.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
				}
			} else {
				text = await res.text();
			}

			const truncated = text.length > limit;
			const output = text.slice(0, limit);
			const header = title ? `# ${title}\n\n` : "";
			const body = truncated
				? `${output}\n\n[truncated — ${text.length} chars total, showing first ${limit}]`
				: output;

			return {
				content: [{ type: "text", text: header + body }],
				details: { title, length: text.length, truncated },
			};
		},

		renderCall(args, theme) {
			const url = (args.url ?? "").slice(0, 60);
			return new Text(theme.fg("toolTitle", "fetch ") + theme.fg("accent", url), 0, 0);
		},

		renderResult(result, _opts, theme) {
			const { title, length, truncated } = (result.details as any) ?? {};
			const label = title ? theme.fg("success", title.slice(0, 40)) : theme.fg("success", "fetched");
			const meta = length ? theme.fg("muted", ` · ${length} chars${truncated ? " [truncated]" : ""}`) : "";
			return new Text(label + meta, 0, 0);
		},
	});
}
