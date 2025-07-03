export function getFailureReason(notes: string | undefined): string {
  if (!notes) return "unknown";
  const note = notes.toLowerCase();

  const map: Record<string, string> = {
    not_ready: "not ready",
    other: "other",
    customer_is_not_home: "customer isn't home",
    shop_is_closed: "shop closed",
    did_not_fit: "didn't fit",
    too_heavy: "too heavy",
    damaged: "damaged",
    no_space: "no space",
    incorrect_address: "incorrect address",
  };

  for (const key of Object.keys(map)) {
    if (note.includes(key)) {
      return map[key];
    }
  }

  return notes.replace(/_/g, " ");
}
