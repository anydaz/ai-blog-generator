interface SSECallbacks {
  onProgress?: (step: number, message: string) => void;
  onComplete?: (data: { title: string; [key: string]: unknown }) => void;
  onError?: (message: string) => void;
}

export async function onMessageReceived(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  callbacks: SSECallbacks,
): Promise<void> {
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));

        if (eventType === "progress" && callbacks.onProgress) {
          callbacks.onProgress(data.step, data.message);
        } else if (eventType === "complete" && callbacks.onComplete) {
          callbacks.onComplete(data);
        } else if (eventType === "error" && callbacks.onError) {
          callbacks.onError(data.message);
        }
      }
    }
  }
}
