/*
 * Whether a product dialog is open, outside React. The page's 3D scene pauses
 * its loop while one is (the dialog covers the page; the jewelry dialog runs
 * its own small renderer), and resumes when it starts to close.
 */

let open = 0;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

/** Marks a dialog open; the returned function marks it closed (safe to call twice). */
export function holdDialog(): () => void {
  open += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    open -= 1;
    emit();
  };
}

export function isDialogOpen(): boolean {
  return open > 0;
}

export function subscribeDialogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
