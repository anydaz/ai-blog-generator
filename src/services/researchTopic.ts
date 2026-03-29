import { getPlaywrightMcpClient } from "./playwrightMcp";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Uses Playwright MCP + OpenAI to autonomously research a topic on the web.
 * The LLM is equipped with browser tools and decides how to navigate,
 * search, read pages, and extract useful information.
 */
async function researchTopic(topic: string): Promise<string> {
  const client = await getPlaywrightMcpClient();

  try {
    // 2. Get available browser tools and convert to OpenAI format
    const { tools: mcpTools } = await client.listTools();

    const openaiTools: ChatCompletionTool[] = mcpTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema as Record<string, unknown>,
      },
    }));

    // 3. Set up the agentic research loop
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a web research assistant with access to a real browser. Your job is to research a topic thoroughly by browsing the web.

STRATEGY:
1. Navigate to a search engine (use https://duckduckgo.com/?q=YOUR+SEARCH+TERMS)
2. Take a browser snapshot to see the search results
3. Click on the most relevant and authoritative results (2-4 sources)
4. For each page, take a snapshot to read the content
5. Collect key facts, statistics, quotes, and insights

IMPORTANT:
- Focus on finding factual, up-to-date, diverse information from multiple sources
- Prefer authoritative sources (established publications, research papers, official sites)
- Keep track of source URLs for attribution
- After visiting 2-4 sources, compile your findings

When you have gathered enough research, respond with a final message containing ALL your research findings in this format:

RESEARCH FINDINGS:
[Organized summary of everything you learned]

SOURCES:
- [Source Title](URL)
- [Source Title](URL)
...
`,
      },
      {
        role: "user",
        content: `Research the following topic thoroughly: "${topic}"

Browse the web, visit multiple sources, and gather comprehensive information. Include key facts, recent developments, expert opinions, and statistics where available.`,
      },
    ];

    const MAX_ITERATIONS = 15;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      console.log(`[Research] Iteration ${i + 1}/${MAX_ITERATIONS}...`);

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        tools: openaiTools,
        temperature: 0.3,
      });

      const choice = response.choices[0];
      if (!choice?.message) break;

      messages.push(choice.message);

      // If the LLM is done (no tool calls), return its final research summary
      if (
        choice.finish_reason === "stop" ||
        !choice.message.tool_calls?.length
      ) {
        console.log("[Research] LLM finished research");
        return choice.message.content || "No research data collected.";
      }

      // Execute each tool call via MCP
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== "function") continue;
        const toolName = toolCall.function.name;
        let toolArgs: Record<string, unknown>;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        console.log(
          `[Research] Tool: ${toolName}`,
          JSON.stringify(toolArgs).slice(0, 100),
        );

        try {
          const result = await client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          // Extract text from MCP result
          const resultText = Array.isArray(result.content)
            ? result.content
                .filter(
                  (c): c is { type: "text"; text: string } => c.type === "text",
                )
                .map((c) => c.text)
                .join("\n")
            : String(result.content);

          // Truncate very long results to stay within token limits
          const truncated =
            resultText.length > 8000
              ? resultText.slice(0, 8000) + "\n... [content truncated]"
              : resultText;

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: truncated,
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error(`[Research] Tool error (${toolName}):`, errMsg);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: ${errMsg}`,
          });
        }
      }
    }

    // If we hit max iterations, ask the LLM to summarize what it has
    messages.push({
      role: "user",
      content:
        "You've reached the research limit. Please compile and return all the research findings you've gathered so far.",
    });

    const finalResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });

    return (
      finalResponse.choices[0]?.message?.content ||
      "No research data collected."
    );
  } catch (error) {
    console.error("[Research] Error during research:", error);
    throw error;
  }
}

export default researchTopic;
