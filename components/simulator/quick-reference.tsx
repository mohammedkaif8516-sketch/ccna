"use client";

import { C, NcStyles, Shell } from "./_shared";

/* ───────────────────────── 3. quick reference ───────────────────────── */

export function QuickReference() {
  const rows = [
    ["Twisted pair (Cat 3, 5, 5e, 6)", "Electrical signals on 8 copper wires", "Max 100 m, max 1 Gbps", "Connecting devices in a LAN", C.TP],
    ["Coaxial", "Signals on a thick copper wire", "Not given in notes", "Television service (not networking)", C.COAX],
    ["Single-mode fibre", "One ray of light", "Km (e.g. 40 km, 100 km)", "Countries and distant locations", C.FIB],
    ["Multi-mode fibre", "Multiple rays of light", "Shorter distance", "Inside an environment (LAN, WAN)", C.FIB],
  ];
  return (
    <Shell title="Quick reference" desc="All cable types side by side." badge="Cheat sheet">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[620px] text-xs">
          <thead className="bg-muted/50"><tr>{["Cable", "Carries", "Distance / speed", "Used for"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <td className="px-3 py-2 font-semibold" style={{ color: r[4] }}>{r[0]}</td><td className="px-3 py-2">{r[1]}</td><td className="px-3 py-2">{r[2]}</td><td className="px-3 py-2">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <QuickReference />
    </>
  );
}
