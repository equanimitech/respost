import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  buildProposeUrl,
  composeUrlInputSchema,
} from "@/application/composer/composeUrl";
import { draftBlockSchema } from "@/presenters/components/postcard-design/compose-flow/draftSchema";

// ─── Tool input shape ──────────────────────────────────────────
//
// One stateless tool: `compose_url`. Caller passes postcard
// fields; we mint a prefilled compose URL that the existing
// composer (`/compose`) already understands via nuqs.
//
// Schemas live in @/application/composer/composeUrl and
// @/presenters/.../draftSchema. This route is a thin adapter —
// no codec, no draft, no storage.

const composeInputShape = {
  to: z
    .string()
    .max(80)
    .optional()
    .describe("Recipient name as written on the envelope."),
  from: z
    .string()
    .max(80)
    .optional()
    .describe("Sender display name."),
  place: z
    .string()
    .max(160)
    .optional()
    .describe("Sender's place line (e.g. 'Barcelona', 'from the train')."),
  blocks: z
    .array(draftBlockSchema)
    .max(40)
    .optional()
    .describe(
      [
        "Ordered body blocks. Use md/music/video/place/article.",
        "Photo blocks are rejected — photos must be uploaded in the composer.",
        "`md` content is markdown rendered through tiptap-markdown with",
        "StarterKit (heading/codeBlock off, html off, tightLists, breaks).",
        "Supported: paragraphs, bold, italic, links, bullet/ordered lists,",
        "blockquote, horizontal rule, inline code. Not supported:",
        "`#` headings, fenced code blocks, tables, image syntax, raw HTML.",
        "Interleave md and media blocks (md / media / md / media).",
        "Do not embed links inside md — use article/music/video/place blocks.",
      ].join(" ")
    ),
};

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "compose_url",
      {
        title: "Compose a Respost",
        description:
          "Mint a prefilled compose URL for a Respost postcard. Stateless — the URL itself carries the payload. The human opens it, reviews, adds photos if needed, and publishes from the browser. Do not include photo blocks; photos are added in the composer.",
        inputSchema: composeInputShape,
      },
      async (args) => {
        const photoCount =
          args.blocks?.filter((b) => b.type === "photo").length ?? 0;
        if (photoCount > 0) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Refused: ${photoCount} photo block(s) in payload. Photos require uploaded blobs and must be added in the composer, not via URL.`,
              },
            ],
          };
        }

        const parsed = composeUrlInputSchema.safeParse(args);
        if (parsed.success === false) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Invalid compose input: ${parsed.error.message}`,
              },
            ],
          };
        }

        const url = buildProposeUrl(parsed.data);
        return {
          content: [{ type: "text", text: url }],
        };
      }
    );
  },
  {
    serverInfo: {
      name: "respost-mcp",
      version: "0.1.0",
    },
    capabilities: { tools: {} },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
