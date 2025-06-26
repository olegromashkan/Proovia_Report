export function getFailureReason(notes: string | undefined): string {
  if (!notes) return 'unknown';
  const note = notes.toLowerCase();
  if (note.includes('not_ready')) return 'not ready';
  if (note.includes('other')) return 'other';
  if (note.includes('customer_is_not_home')) return "isn't home";
  if (note.includes('shop_is_closed')) return 'is closed';
  if (note.includes('did_not_fit')) return "didn't fit";
  if (note.includes('too_heavy')) return 'too heavy';
  if (note.includes('damaged')) return 'damaged';
  if (note.includes('no_space')) return 'no space';
  if (note.includes('incorrect_address')) return 'incorrect address';
  return 'unknown';
}
