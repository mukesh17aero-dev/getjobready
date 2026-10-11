/** Shared UI ownership: the latest activated panel is the only open panel. */
let active: string | null = null;
const listeners = new Set<() => void>();

function publish(next: string | null) {
  if (active === next) return;
  active = next;
  listeners.forEach(listener => listener());
}

export const exclusivePanel = {
  getSnapshot: () => active,
  getServerSnapshot: (): string | null => null,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  activate(owner: string) { publish(owner); },
  dismiss(owner: string) {
    // A late leave/unmount from the previous panel cannot close the new one.
    if (active === owner) publish(null);
  },
};
