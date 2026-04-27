"use client";

/**
 * Lightweight toast utility — drop-in replacement for alert().
 * Renders a transient notification in the bottom-right of the page.
 *
 * Usage:
 *   import { toast } from "@/lib/toast";
 *   toast.success("Saved!");
 *   toast.error("Failed.");
 *   toast.info("Heads up");
 */

type ToastType = "success" | "error" | "info" | "warning";

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "#ecfdf5", border: "#10b981", text: "#065f46", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", icon: "✕" },
  info:    { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a", icon: "i" },
  warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", icon: "!" },
};

function show(message: string, type: ToastType = "info", durationMs = 4000) {
  if (typeof window === "undefined") return;

  const c = COLORS[type];
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    background: ${c.bg};
    border: 1px solid ${c.border};
    color: ${c.text};
    padding: 12px 18px 12px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.45;
    box-shadow: 0 10px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
    max-width: 360px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    transform: translateY(8px);
    opacity: 0;
    transition: opacity 220ms ease, transform 220ms ease;
  `;

  const iconEl = document.createElement("div");
  iconEl.textContent = c.icon;
  iconEl.style.cssText = `
    width: 20px; height: 20px; border-radius: 999px;
    background: ${c.border}; color: white; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0; margin-top: 1px;
  `;

  const textEl = document.createElement("div");
  textEl.textContent = message;
  textEl.style.cssText = "flex: 1;";

  const closeEl = document.createElement("button");
  closeEl.textContent = "×";
  closeEl.style.cssText = `
    background: transparent; border: none; cursor: pointer;
    color: ${c.text}; opacity: 0.5; font-size: 18px; padding: 0;
    margin-left: 4px; line-height: 1; flex-shrink: 0;
  `;
  closeEl.onmouseover = () => (closeEl.style.opacity = "1");
  closeEl.onmouseout = () => (closeEl.style.opacity = "0.5");

  const dismiss = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 240);
  };

  closeEl.onclick = dismiss;

  el.appendChild(iconEl);
  el.appendChild(textEl);
  el.appendChild(closeEl);
  document.body.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  if (durationMs > 0) {
    setTimeout(dismiss, durationMs);
  }
}

export const toast = {
  success: (msg: string, durationMs?: number) => show(msg, "success", durationMs),
  error: (msg: string, durationMs?: number) => show(msg, "error", durationMs),
  info: (msg: string, durationMs?: number) => show(msg, "info", durationMs),
  warning: (msg: string, durationMs?: number) => show(msg, "warning", durationMs),
};
