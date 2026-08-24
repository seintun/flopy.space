export function enableDragScroll(el: HTMLElement): () => void {
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasMoved = false;

  el.classList.add("drag-scroll");

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isDown = true;
    hasMoved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) {
      hasMoved = true;
    }
    el.scrollLeft = scrollLeft - walk;
  };

  const onPointerUp = () => {
    if (!isDown) return;
    isDown = false;
  };

  const onClick = (e: MouseEvent) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      hasMoved = false;
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("click", onClick, true);

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    el.removeEventListener("click", onClick, true);
  };
}
