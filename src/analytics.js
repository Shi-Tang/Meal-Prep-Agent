import posthog from "posthog-js";

// Read config from Vite env. Set these in .env.local (local) and in the Vercel
// project's Environment Variables (production). If the key is absent we no-op,
// so the app still works locally without any analytics backend.
const KEY  = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let enabled = false;

export function initAnalytics() {
  if (enabled || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    // Automatically capture clicks, inputs and $pageview/$pageleave events
    // (the latter gives us per-page dwell time without manual timing).
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    // Record sessions so we can replay how users actually navigate.
    session_recording: { maskAllInputs: false },
    persistence: "localStorage+cookie",
  });
  enabled = true;
}

// Named business events on top of autocapture. Safe to call even when PostHog
// isn't configured — it simply does nothing.
export function track(event, props = {}) {
  if (!enabled) return;
  posthog.capture(event, props);
}

export { posthog };
