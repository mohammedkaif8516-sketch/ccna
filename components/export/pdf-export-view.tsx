"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Download, Loader2, X } from "lucide-react";
import { topics } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import type { ExportGroup, ExportOptions } from "./pdf-document";
import { useLabSnapshots } from "./use-lab-snapshots";

const DEFAULTS: ExportOptions = {
  pageSize: "A4",
  orientation: "portrait",
  cover: true,
  toc: true,
  quickRef: true,
  diagrams: true,
  breakPerSubtopic: false,
  labs: true,
  answerKey: true,
};

export function PdfExportView({
  selectedSlugs,
  onDone,
}: {
  selectedSlugs: string[];
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [opts, setOpts] = useState<ExportOptions>(DEFAULTS);
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const runId = useRef(0);
  const urlRef = useRef<string | null>(null);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => setMounted(true), []);

  const groups: ExportGroup[] = useMemo(() => {
    const wanted = new Set(selectedSlugs);
    return topics
      .map((t) => ({
        slug: t.slug,
        number: t.number,
        title: t.title,
        pages: t.subtopics.filter((s) => wanted.has(s.slug)),
      }))
      .filter((g) => g.pages.length > 0);
  }, [selectedSlugs]);

  const pageCount = groups.reduce((n, g) => n + g.pages.length, 0);

  const { snaps: labs, busy: labsBusy } = useLabSnapshots(selectedSlugs);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDoneRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lock background scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // (Re)generate the PDF whenever selection or options change (debounced)
  useEffect(() => {
    if (groups.length === 0 || labsBusy) return;
    const id = ++runId.current;
    setStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const [{ pdf }, mod] = await Promise.all([
          import("@react-pdf/renderer"),
          import("./pdf-document"),
        ]);
        const usableImages = opts.diagrams
          ? await mod.findUsableImages(groups)
          : new Set<string>();

        const blob = await pdf(
          <mod.PdfDocument
            groups={groups}
            options={opts}
            usableImages={usableImages}
            labs={labs}
          />,
        ).toBlob();

        if (id !== runId.current) return; // a newer run superseded this one
        const next = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = next;
        setUrl(next);
        setSize(blob.size);
        setStatus("ready");
      } catch (e) {
        if (id !== runId.current) return;
        console.error("PDF generation failed", e);
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [groups, opts, labs, labsBusy]);

  // free the blob on unmount
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `ccna-notes-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const set = <K extends keyof ExportOptions>(k: K, v: ExportOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-background text-foreground">
      {/* header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold normal-case tracking-normal">
            Export to PDF
          </h2>
          <p className="text-xs text-muted-foreground">
            {pageCount} {pageCount === 1 ? "page" : "pages"} selected
            {status === "ready" && size > 0 && ` · ${(size / 1024).toFixed(0)} KB`}
          </p>
        </div>
        <Button
          onClick={download}
          disabled={status !== "ready" || labsBusy}
          className="gap-2"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download PDF
        </Button>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onDone}>
          <X />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* options */}
        <aside className="shrink-0 space-y-5 overflow-y-auto border-b p-4 md:w-72 md:border-b-0 md:border-r">
          <Field label="Paper size">
            <Seg
              value={opts.pageSize}
              onChange={(v) => set("pageSize", v)}
              options={[
                ["A4", "A4"],
                ["LETTER", "Letter"],
              ]}
            />
          </Field>
          <Field label="Orientation">
            <Seg
              value={opts.orientation}
              onChange={(v) => set("orientation", v)}
              options={[
                ["portrait", "Portrait"],
                ["landscape", "Landscape"],
              ]}
            />
          </Field>
          <Field label="Include">
            <Check label="Cover page" checked={opts.cover} onChange={(v) => set("cover", v)} />
            <Check label="Table of contents" checked={opts.toc} onChange={(v) => set("toc", v)} />
            <Check label="Quick reference boxes" checked={opts.quickRef} onChange={(v) => set("quickRef", v)} />
            <Check label="Diagrams" checked={opts.diagrams} onChange={(v) => set("diagrams", v)} />
            <Check label="Lab topology & objectives" checked={opts.labs} onChange={(v) => set("labs", v)} />
            <Check label="Lab answer keys" checked={opts.answerKey} onChange={(v) => set("answerKey", v)} />
          </Field>
          <Field label="Layout">
            <Check
              label="Start each subtopic on a new page"
              checked={opts.breakPerSubtopic}
              onChange={(v) => set("breakPerSubtopic", v)}
            />
          </Field>
        </aside>

        {/* preview */}
        <main className="relative min-h-0 flex-1 bg-muted">
          {url && (
            <iframe
              key={url}
              src={`${url}#view=FitH`}
              title="PDF preview"
              className="hidden h-full w-full md:block"
            />
          )}

          {/* phones can't embed PDFs, so just say so */}
          <p className="p-6 text-center text-sm text-muted-foreground md:hidden">
            Preview isn't available on small screens. Use Download PDF.
          </p>

          {(status === "loading" || labsBusy) && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow">
                <Loader2 className="size-4 animate-spin" />
                {labsBusy ? "Rendering labs…" : "Building PDF…"}
              </span>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 grid place-items-center p-6">
              <div className="max-w-md rounded-xl border bg-card p-5 text-center">
                <AlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
                <p className="font-medium">Couldn't build the PDF</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">{error}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Check that the font files exist in <code>/public/fonts</code>.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>,
    document.body,
  );
}

/* ── tiny UI helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-lg border p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            value === v
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}