export function initInput(onFlap: () => void, onFirstGesture: () => void): () => void {
  let gestured = false;

  const isInteractive = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return !!target.closest(
      "button, .btn, .interactive, .drag-scroll, .tab-btn, input, select, a, #menu-drawer, #gameover-overlay, #hud-rewind-panel",
    );
  };

  const triggerGesture = () => {
    if (!gestured) {
      gestured = true;
      onFirstGesture();
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    if (isInteractive(e.target)) {
      triggerGesture();
      return;
    }

    if (e.cancelable) e.preventDefault();
    triggerGesture();
    onFlap();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && !e.repeat) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;
      e.preventDefault();
      triggerGesture();
      onFlap();
    }
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("keydown", onKeyDown);

  return () => {
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown);
  };
}
