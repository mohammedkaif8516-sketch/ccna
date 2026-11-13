"use client";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { domToPng } from "modern-screenshot";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { LAB_LOADERS, type LabExport } from "@/lib/lab-registry";

export type LabSnapshot = { data: LabExport; image?: string; ratio?: number };

const cache = new Map<string, LabSnapshot>();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickComponent(mod: unknown): ComponentType | null {
  const m = mod as Record<string, unknown>;
  if (typeof m.default === "function") return m.default as ComponentType;
  const key = Object.keys(m).find(
    (k) => k !== "LAB_EXPORT" && typeof m[k] === "function",
  );
  return key ? (m[key] as ComponentType) : null;
}

async function capture(slug: string): Promise<LabSnapshot | null> {
  const load = LAB_LOADERS[slug];
  if (!load) return null;
  const mod = await load();
  const snap: LabSnapshot = { data: mod.LAB_EXPORT };

  const host = document.createElement("div");
  // off-screen but still laid out (display:none would give 0x0)
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1400px;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const Lab = pickComponent(mod);
    if (!Lab) return snap; // no component found, still export the answer key
    root.render(<Lab />);
    host.setAttribute("data-capture", "");
    const style = document.createElement("style");
    style.textContent = `
  [data-capture] *, [data-capture] *::before, [data-capture] *::after {
    filter: none !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
    mix-blend-mode: normal !important;
    animation: none !important;
    transition: none !important;
  }`;
    host.appendChild(style);
    await wait(700); // let layout/SVG settle
    const el = host.querySelector<HTMLElement>("[data-netlab]");
    console.log("netlab found:", !!el, el?.offsetWidth, el?.offsetHeight);
    if (el) {
      snap.image = await domToPng(el, {
        scale: 2,
        backgroundColor: "#0b1220",
      });
      snap.ratio = el.offsetWidth / el.offsetHeight;
    }
  } catch (e) {
    console.warn("Lab snapshot failed for", slug, e);
  } finally {
    root.unmount();
    host.remove();
  }
  return snap;
}

export function useLabSnapshots(slugs: string[]) {
  const [snaps, setSnaps] = useState<Record<string, LabSnapshot>>({});
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    const labSlugs = slugs.filter((s) => s in LAB_LOADERS);
    if (labSlugs.length === 0) {
      setSnaps({});
      return;
    }
    setBusy(true);
    (async () => {
      const out: Record<string, LabSnapshot> = {};
      for (const s of labSlugs) {
        if (!cache.has(s)) {
          const snap = await capture(s); // sequential: keeps memory low
          if (snap) cache.set(s, snap);
        }
        if (cache.has(s)) out[s] = cache.get(s)!;
      }
      if (id !== run.current) return;
      setSnaps(out);
      setBusy(false);
    })();
  }, [slugs.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { snaps, busy };
}
