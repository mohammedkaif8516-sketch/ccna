"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { C, DATA_ROLE, NcStyles, PINS, Shell, sw, Tip } from "./_shared";

/* ───────────────────────── 5. colour codes ───────────────────────── */

const PALETTE = ["Brown", "Blue White", "Green", "Orange White", "Brown White", "Blue", "Orange", "Green White"];

export function ColorCodeLab() {
  const [placed, setPlaced] = useState<(string | null)[]>(Array(8).fill(null));
  const [showData, setShowData] = useState(true);
  const next = placed.findIndex((p) => p === null);
  const wrong = placed.filter((p, i) => p !== null && p !== PINS[i].name).length;
  const done = next === -1 && wrong === 0;
  const get = (n: string) => PINS.find((p) => p.name === n)!;

  return (
    <Shell title="Build the EIA/TIA-568B cable" desc="Attaching an RJ-45 connector to the cable is called crimping. Place the 8 wires in the correct order, pin 1 to pin 8.">
      <div className="flex flex-wrap gap-2 text-xs">
        {["Orange", "Blue", "Green", "Brown"].map((c) => (
          <Badge key={c} variant="secondary">{c} & {c}-white</Badge>
        ))}
      </div>
      <div className="rounded-xl border bg-background p-4">
        <p className="mb-3 text-xs font-medium">RJ-45 connector (pin 1 on the left)</p>
        <div className="grid grid-cols-8 gap-1.5">
          {placed.map((p, i) => {
            const w = p ? get(p) : null;
            const bad = p !== null && p !== PINS[i].name;
            const good = p !== null && !bad;
            return (
              <div key={`${i}-${p}`} className={`flex flex-col items-center gap-1 ${bad ? "nc-shake" : p ? "nc-pop" : ""}`}>
                <div className="h-20 w-full rounded-md border-2" style={{ background: w ? sw(w) : undefined, borderColor: bad ? C.RED : good ? C.GREEN : i === next ? C.CODE : "#adb5bd", borderStyle: p ? "solid" : "dashed" }} />
                <span className="text-xs font-bold">{i + 1}</span>
                {showData && <span className="text-[10px] font-semibold" style={{ color: DATA_ROLE[i + 1] ? C.CODE : "#868e96" }}>{DATA_ROLE[i + 1] ?? "-"}</span>}
                <span className="h-7 text-center text-[9px] leading-3 text-muted-foreground">{p ?? ""}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((name) => {
          const w = get(name);
          const used = placed.includes(name);
          return (
            <button key={name} disabled={used || next === -1} onClick={() => { const p = [...placed]; p[next] = name; setPlaced(p); }}
              className="flex items-center gap-2 rounded-lg border px-2 py-1 text-xs disabled:opacity-35">
              <span className="inline-block h-5 w-5 rounded" style={{ background: sw(w) }} />{name}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={next === 0} onClick={() => { const i = next === -1 ? 7 : next - 1; const p = [...placed]; p[i] = null; setPlaced(p); }}>Undo</Button>
        <Button size="sm" variant="outline" onClick={() => setPlaced(PINS.map((p) => p.name))}>Show answer</Button>
        <Button size="sm" variant="ghost" onClick={() => setPlaced(Array(8).fill(null))}>Reset</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowData((v) => !v)}>{showData ? "Hide" : "Show"} Tx / Rx</Button>
      </div>
      <p key={`${wrong}-${done}`} className="nc-fade text-xs font-medium" style={{ color: done ? C.GREEN : wrong ? C.RED : "#868e96" }}>
        {done ? "Perfect. This is the EIA/TIA-568B order, ready to crimp." : wrong ? "A red wire is in the wrong place. Press Undo." : "Pick the colour for the highlighted pin."}
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-xs">
          <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left font-medium">Pin</th><th className="px-3 py-2 text-left font-medium">Colour</th><th className="px-3 py-2 text-left font-medium">Role</th></tr></thead>
          <tbody>
            {PINS.map((p) => (
              <tr key={p.n} className="border-t">
                <td className="px-3 py-2 font-mono">{p.n}</td>
                <td className="px-3 py-2"><span className="mr-2 inline-block h-3 w-6 rounded align-middle" style={{ background: sw(p) }} />{p.name}</td>
                <td className="px-3 py-2" style={DATA_ROLE[p.n] ? { color: C.CODE, fontWeight: 600 } : undefined}>{DATA_ROLE[p.n] ? `${DATA_ROLE[p.n] === "Tx" ? "Tx (transmit)" : "Rx (receive)"}` : "not used for data"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Tip color={C.CODE}>There are 8 wires, but Ethernet only uses 4 of them for data: the Tx (transmit) and Rx (receive) pins.</Tip>
    </Shell>
  );
}

export default function Page() {
  return (
    <>
      <NcStyles />
      <ColorCodeLab />
    </>
  );
}
