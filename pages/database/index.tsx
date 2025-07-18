export default function Database() {
  if (typeof window !== 'undefined') {
    window.location.href = '/settings';
  }
  return null;
}
