import Modal from './Modal';

export default function TopListModal({
  open,
  onClose,
  title,
  items,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: [string, number][];
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="overflow-auto max-h-[80vh]">
        <table className="table table-sm w-full">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Name</th>
              <th className="whitespace-nowrap text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([name, count]) => (
              <tr key={name} className="border-t border-base-300">
                <td className="whitespace-nowrap">{name}</td>
                <td className="text-right">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
