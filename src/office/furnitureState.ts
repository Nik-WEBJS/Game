// Shared mutable state for furniture placement mode (outside React to avoid re-renders)
export const furniturePlacement = {
  active: false,
  selectedId: null as string | null, // furniture item ID being placed/moved
};

// Listeners for React components to subscribe
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export function startPlacement(furnitureId: string) {
  furniturePlacement.active = true;
  furniturePlacement.selectedId = furnitureId;
  notify();
}

export function cancelPlacement() {
  furniturePlacement.active = false;
  furniturePlacement.selectedId = null;
  notify();
}

export function subscribePlacement(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
