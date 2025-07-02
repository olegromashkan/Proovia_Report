import useLoadingStore from '../lib/useLoadingStore';

export default function GlobalLoader() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <span className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
    </div>
  );
}
