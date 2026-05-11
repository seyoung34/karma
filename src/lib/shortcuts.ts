const punctuationKeys: Record<string, string> = {
  Backquote: "`",
  Backslash: "\\",
  BracketLeft: "[",
  BracketRight: "]",
  Comma: ",",
  Equal: "=",
  Minus: "-",
  Period: ".",
  Quote: "'",
  Semicolon: ";",
  Slash: "/"
};

export function eventToShortcut(event: KeyboardEvent) {
  const keys: string[] = [];
  if (event.ctrlKey || event.metaKey) keys.push("Ctrl");
  if (event.altKey) keys.push("Alt");
  if (event.shiftKey) keys.push("Shift");
  const key = event.key === " "
    ? "Space"
    : punctuationKeys[event.code] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  if (!["Control", "Shift", "Alt", "Meta"].includes(key)) keys.push(key);
  return keys.join("+");
}
