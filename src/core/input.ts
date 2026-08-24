export function initInput(onFlap: () => void, onFirstGesture: () => void): () => void {
  let gestured = false;

  const fire = (e?: Event) => {
    if (e && e.target instanceof HTMLElement) {
      if (e.target.closest("button, .btn, .interactive")) return;
    }
    if (!gestured) {
      gestured = true;
      onFirstGesture();
    }
    onFlap();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest("button, .btn, .interactive")) {
      if (!gestured) {
        gestured = true;
        onFirstGesture();
      }
      return;
    }
    e.preventDefault();
    fire();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      fire();
    }
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown);
  };
}
