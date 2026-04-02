import { toolDefinitions, executeTool, ToolName } from './tools';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
}

// ── LLM call stub ────────────────────────────────────────────────────────────
// TODO: Replace with real LLM API call (e.g. Gemini, Groq, OpenAI)
// The function should support tool calling. The stub below simulates the
// response shape so the agentic loop can be wired up without the API key.
//
// Expected real response shape (OpenAI-compatible):
// {
//   content: string | null,      // text response if no tool call
//   tool_call: {                 // present when LLM decides to use a tool
//     name: string,
//     arguments: Record<string, any>
//   } | null
// }
async function callLLM(
  messages: { role: string; content: string }[]
): Promise<{ content: string | null; tool_call: { name: string; arguments: Record<string, any> } | null }> {
  // TODO: wire up LLM API
  // Example with OpenAI:
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4o-mini',
  //   messages,
  //   tools: toolDefinitions.map(t => ({ type: 'function', function: t })),
  //   tool_choice: 'auto',
  // });
  // const choice = response.choices[0].message;
  // const toolCall = choice.tool_calls?.[0];
  // return {
  //   content: choice.content ?? null,
  //   tool_call: toolCall
  //     ? { name: toolCall.function.name, arguments: JSON.parse(toolCall.function.arguments) }
  //     : null,
  // };

  return {
    content: "I'm Orbiit AI. The LLM API is not connected yet — check the TODO in chat.service.ts.",
    tool_call: null,
  };
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(workspaceId: string): string {
  return `You are Orbiit AI, a project management assistant embedded in the Orbiit app.
You help users manage tasks, projects, and workspaces through natural conversation.

The user's current workspace ID is: ${workspaceId}

You have access to the following tools:
${toolDefinitions.map((t) => `- ${t.name}: ${t.description}`).join('\n')}

When a user asks to see tasks, create a task, or update a status, call the appropriate tool.
Always respond in a friendly, concise tone. Format task lists clearly.`;
}

// ── Agentic loop ─────────────────────────────────────────────────────────────
// Runs up to maxSteps tool calls before returning a final text response.

export async function runChatAgent(
  userMessage: string,
  history: ChatMessage[],
  workspaceId: string,
  maxSteps = 3
): Promise<{ reply: string; updatedHistory: ChatMessage[] }> {
  const systemMessage = { role: 'system', content: buildSystemPrompt(workspaceId) };

  // Build the message array for the LLM
  const messages: { role: string; content: string }[] = [
    systemMessage,
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  let steps = 0;

  while (steps < maxSteps) {
    const llmResponse = await callLLM(messages);

    if (!llmResponse.tool_call) {
      // Final text response
      const reply = llmResponse.content ?? 'Sorry, I could not generate a response.';
      updatedHistory.push({ role: 'assistant', content: reply });
      return { reply, updatedHistory };
    }

    // Tool call path
    const { name, arguments: toolArgs } = llmResponse.tool_call;
    const toolResult = await executeTool(name as ToolName, toolArgs);
    const toolResultStr = JSON.stringify(toolResult);

    // Append tool interaction to message thread
    messages.push({ role: 'assistant', content: `[Calling tool: ${name}]` });
    messages.push({ role: 'tool', content: toolResultStr });
    updatedHistory.push({ role: 'tool', content: toolResultStr, toolName: name });

    steps++;
  }

  // Fallback if max steps hit
  const fallback = 'I ran into a problem completing that request. Please try again.';
  updatedHistory.push({ role: 'assistant', content: fallback });
  return { reply: fallback, updatedHistory };
}
