export default function Admin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/settings';
  }
  return null;
}
