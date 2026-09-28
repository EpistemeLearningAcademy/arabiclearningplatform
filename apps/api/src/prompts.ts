export async function readHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Run this command in a terminal so the password can be entered privately.");
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.setEncoding("utf8");
  process.stdin.resume();

  return await new Promise<string>((resolvePromise, rejectPromise) => {
    let value = "";
    const onData = (key: string) => {
      if (key === "\u0003") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        rejectPromise(new Error("Setup cancelled."));
        return;
      }
      if (key === "\r" || key === "\n") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolvePromise(value);
        return;
      }
      if (key === "\u0008" || key === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      if (!key.startsWith("\u001b") && key >= " ") value += key;
    };
    process.stdin.on("data", onData);
  });
}
