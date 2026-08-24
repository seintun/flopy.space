export function initInput(onFlap: () => void, onFirstGesture: () => void): () => void {
  let gestured = false;

  const isInteractive = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest(
      "button, .btn, .interactive, #main-menu, #menu-drawer, #menu-tab-content, #menu-tabs, #hud-rewind-panel, #gameover-overlay, #hud, .drag-scroll, .tab-btn, [role='status']",
    );
  };

  const fire = (e?: Event) => {
    if (e && isInteractive(e.target)) return;
    if (!gestured) {
      gestured = true;
      onFirstGesture();
    }
    onFlap();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (isInteractive(e.target)) {
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
