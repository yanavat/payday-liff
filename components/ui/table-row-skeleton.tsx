export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-bg-secondary" />
          <div className="h-3 w-28 rounded bg-bg-secondary" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 rounded bg-bg-secondary" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-3 w-16 rounded bg-bg-secondary" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-24 rounded bg-bg-secondary" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-bg-secondary" />
      </td>
    </tr>
  );
}
