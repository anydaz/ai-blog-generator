import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedPost {
  title: string;
  content: string;
  summary: string;
}

/**
 * Uses OpenAI to generate a blog post based on research data and a topic.
 */
async function generateBlogPost(
  topic: string,
  research: string,
): Promise<GeneratedPost> {
  const researchContext = research;

  const systemPrompt = `You are an expert blog writer. You write engaging, well-researched, and informative blog posts.
Your writing style is professional yet approachable. You use clear headings, short paragraphs, and include relevant examples.
Always write in Markdown format.`;

  const userPrompt = `Write a comprehensive, engaging blog post about the following topic: "${topic}"

Use the following research data as reference material. Synthesize the information into a coherent, original blog post.
Do NOT copy content verbatim — rephrase and add your own analysis.

RESEARCH DATA:
${researchContext || "No research data available. Write based on your general knowledge."}

REQUIREMENTS:
1. Create an engaging, SEO-friendly title
2. Write a compelling introduction
3. Use H2 and H3 headings to organize content
4. Include practical examples or actionable insights where appropriate
5. Write a strong conclusion with a call to action
6. The post should be 800-1500 words
7. Write in Markdown format
8. At the end of the content, include a "## Sources" section listing all referenced sources as a bulleted list of markdown links. For example:
   ## Sources
   - [Source Title](https://example.com/article)
   - [Another Source](https://example.com/other)
   If no research sources are available, omit the Sources section.

IMPORTANT: Always respond in the following JSON format:
{
  "title": "Your Blog Post Title",
  "content": "Full markdown content of the blog post (including the title as H1 and a Sources section at the end)",
  "summary": "A 2-3 sentence summary of the blog post for previews"
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 8000,
  });

  const result = response.choices[0]?.message?.content;
  if (!result) {
    throw new Error("Failed to generate blog post: Empty response from OpenAI");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(result);
  } catch {
    // Try to extract JSON from the response if it's wrapped in extra text
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        `Failed to generate blog post: Could not parse JSON from response`,
      );
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  const title = (parsed.title as string) || "";
  const content = (parsed.content as string) || "";
  const summary = (parsed.summary as string) || "";

  if (!title || !content) {
    console.error(
      "[Generator] Invalid response keys:",
      Object.keys(parsed),
      "Response preview:",
      result.slice(0, 500),
    );
    throw new Error(
      `Failed to generate blog post: Invalid response structure. Got keys: ${Object.keys(parsed).join(", ")}`,
    );
  }

  return {
    title,
    content,
    summary: summary || title, // Fallback summary to title if missing
  };
}

export default generateBlogPost;
