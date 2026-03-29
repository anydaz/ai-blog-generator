import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let mcpClient: Client | null = null;

/**
 * Returns a singleton Playwright MCP client.
 * On first call, initializes the server. Subsequent calls reuse the connection.
 */
export async function getPlaywrightMcpClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: [
      "@playwright/mcp",
      "--headless",
      "--isolated",
      "--browser",
      "chromium",
      "--",
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  mcpClient = new Client({ name: "ai-blog-researcher", version: "1.0.0" });
  await mcpClient.connect(transport);

  return mcpClient;
}

/**
 * Closes the Playwright MCP client connection.
 * Call this during graceful shutdown.
 */
export async function closePlaywrightMcp(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }
}
