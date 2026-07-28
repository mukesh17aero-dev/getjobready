/**
 * The admin's "view as" control. Rendered only for real admins — the server
 * refuses the action for anyone else regardless, so this is convenience rather
 * than a security boundary.
 */
export function PreviewSwitcher({
  current,
  action,
}: {
  current: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex items-center gap-1.5">
      <label htmlFor="preview-role" className="text-xs text-slate-500">
        View as
      </label>
      <select
        id="preview-role"
        name="role"
        defaultValue={current}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        <option value="admin">Admin</option>
        <option value="student">Student</option>
        <option value="employer">Employer</option>
      </select>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Go
      </button>
    </form>
  );
}
