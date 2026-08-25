/**
 * Reusable DOM visual effects and animated deduction flyouts.
 */

export function showDeductionFlyout(targetEl: HTMLElement, cost: number): void {
  if (typeof document === "undefined" || !targetEl) return;
  const rect = targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : { left: 0, top: 0, width: 0 };
  const flyout = document.createElement("div");
  flyout.className = "deduction-flyout";
  flyout.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    transform: translate(-50%, 0);
    color: #ffd700;
    font-size: 16px;
    font-weight: 900;
    text-shadow: 0 0 14px rgba(255, 215, 0, 0.95), 0 2px 6px rgba(0,0,0,0.9);
    pointer-events: none;
    z-index: 10000;
    transition: transform 0.75s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.75s ease;
    opacity: 1;
    letter-spacing: 0.5px;
  `;
  flyout.textContent = `-${cost} 🪙`;
  document.body.appendChild(flyout);

  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      flyout.style.transform = "translate(-50%, -44px) scale(1.2)";
      flyout.style.opacity = "0";
    });
  }

  setTimeout(() => {
    try {
      flyout.remove();
    } catch {
      // already removed
    }
  }, 800);
}
