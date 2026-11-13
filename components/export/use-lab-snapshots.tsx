"use client";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { LAB_LOADERS, type LabExport } from "@/lib/lab-registry";

export type LabSnapshot = { data: LabExport; image?: string; ratio?: number };

const cache = new Map<string, LabSnapshot>();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function capture(slug: string): Promise<LabSnapshot | null> {
  const load = LAB_LOADERS[slug];
  if (!load) return null;
  const mod = await load();
  const snap: LabSnapshot = { data: mod.LAB_EXPORT };

  const host = document.createElement("div");
  // off-screen but still laid out (display:none would give 0x0)
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:1400px;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const Lab = mod.default;
    root.render(<Lab />);
    await wait(700); // let layout/SVG settle
    const el = host.querySelector<HTMLElement>("[data-netlab]");
    if (el) {
      snap.image = await toPng(el, { pixelRatio: 2, cacheBust: true });
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
    if (labSlugs.length === 0) { setSnaps({}); return; }
    setBusy(true);
    (async () => {
      const out: Record<string, LabSnapshot> = {};
      for (const s of labSlugs) {
        if (!cache.has(s)) {
          const snap = await capture(s);   // sequential: keeps memory low
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