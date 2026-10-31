"use client";

/**
 * Static Routing Lab 1 — 3 routers in a line, a switch + 2 PCs behind each, 192.168.XX.0/24 addressing.
 *
 * Every device starts in its factory state (routers: all interfaces shut, no IPs; PCs: no IP).
 * Click a device → console. Do the lab for real: addressing, no shutdown, ip route, ping.
 *
 * To build another lab, copy this file: change the coordinates, the <Cable>s and the notes.
 */
import { NetLab, Cable, Note } from "./netsim";
import Router from "./Router";
import Switch from "./Switch";
import VPC from "./VPC";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Split the answer key into an array of strings so we can map over them individually
const KEY_LINES = `! R1
interface e0/0
 ip address 192.168.4.1 255.255.255.0
 no shutdown
interface e0/1
 ip address 192.168.1.100 255.255.255.0
 no shutdown
ip route 192.168.2.0 255.255.255.0 192.168.4.2
ip route 192.168.3.0 255.255.255.0 192.168.4.2
ip route 192.168.5.0 255.255.255.0 192.168.4.2
! R2
interface e0/0
 ip address 192.168.4.2 255.255.255.0
 no shutdown
interface e0/1
 ip address 192.168.5.2 255.255.255.0
 no shutdown
interface e0/2
 ip address 192.168.2.100 255.255.255.0
 no shutdown
ip route 192.168.1.0 255.255.255.0 192.168.4.1
ip route 192.168.3.0 255.255.255.0 192.168.5.3
! R3
interface e0/0
 ip address 192.168.5.3 255.255.255.0
 no shutdown
interface e0/1
 ip address 192.168.3.100 255.255.255.0
 no shutdown
ip route 192.168.1.0 255.255.255.0 192.168.5.2
ip route 192.168.2.0 255.255.255.0 192.168.5.2
ip route 192.168.4.0 255.255.255.0 192.168.5.2
! VPCs: ip 192.168.1.1/24 192.168.1.100 (VPC7) … .2 on the second PC of each LAN`
  .split("\n")
  .filter((line) => line.trim() !== "");

// Reusable Copy Button Component
function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="group relative flex items-center">
      <span className="flex-1 whitespace-pre">{text}</span>
      <button
        onClick={handleCopy}
        className="ml-4 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}

export function StaticRoutingLab() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 940 }}>
      <NetLab title="Static Routing Lab 1" width={880} height={600}>
        <Note x={440} y={34} size={22}>192.168.XX.0/24</Note>

        {/* backbone */}
        <Cable a="R1:e0/0" b="R2:e0/0" aTag=".1" bTag=".2" />
        <Cable a="R2:e0/1" b="R3:e0/0" aTag=".2" bTag=".3" />
        {/* router ↔ switch */}
        <Cable a="R1:e0/1" b="SW4:e0/0" aTag=".100" />
        <Cable a="R2:e0/2" b="SW5:e0/0" aTag=".100" />
        <Cable a="R3:e0/1" b="SW6:e0/0" aTag=".100" />
        {/* switch ↔ PCs */}
        <Cable a="SW4:e0/1" b="VPC7:eth0" bTag=".1" />
        <Cable a="SW4:e0/2" b="VPC8:eth0" bTag=".2" />
        <Cable a="SW5:e0/2" b="VPC9:eth0" bTag=".1" />
        <Cable a="SW5:e0/1" b="VPC10:eth0" bTag=".2" />
        <Cable a="SW6:e0/1" b="VPC11:eth0" bTag=".1" />
        <Cable a="SW6:e0/2" b="VPC12:eth0" bTag=".2" />

        <Note x={295} y={78}>4.0/24</Note>
        <Note x={585} y={78}>5.0/24</Note>
        <Note x={150} y={572}>1.0/24</Note>
        <Note x={440} y={572}>2.0/24</Note>
        <Note x={730} y={572}>3.0/24</Note>

        <Router id="R1" x={150} y={130} />
        <Router id="R2" x={440} y={130} />
        <Router id="R3" x={730} y={130} />
        <Switch id="SW4" x={150} y={300} />
        <Switch id="SW5" x={440} y={300} />
        <Switch id="SW6" x={730} y={300} />
        <VPC id="VPC7" x={60} y={470} />
        <VPC id="VPC8" x={240} y={470} />
        <VPC id="VPC9" x={350} y={470} />
        <VPC id="VPC10" x={530} y={470} />
        <VPC id="VPC11" x={640} y={470} />
        <VPC id="VPC12" x={820} y={470} />
      </NetLab>

      <details style={{ font: "13px/1.5 ui-sans-serif,system-ui,sans-serif" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Objectives</summary>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li>Address every router interface and every PC from the diagram (routers use .100 on the LAN side).</li>
          <li>Bring the interfaces up and confirm with <code>show ip interface brief</code>.</li>
          <li>Add static routes so every PC can ping every other PC (watch the <em>Ping matrix</em> turn green).</li>
          <li>Break something on purpose: remove one return route and compare <code>ping</code> timeouts with "Destination unreachable".</li>
          <li>Save with <code>copy running-config startup-config</code> (the dot beside the name turns green) and test <code>reload</code>.</li>
        </ol>
      </details>
      
            <details style={{ font: "13px/1.5 ui-sans-serif,system-ui,sans-serif" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Answer key (click any line to copy!)</summary>
        
        <div style={{ 
          marginTop: "8px", 
          background: "var(--muted, #f4f4f5)", 
          padding: "12px", 
          borderRadius: "8px",
          maxHeight: "350px",  // <--- Sets the maximum height
          overflowY: "auto"    // <--- Enables vertical scrolling
        }}>
          <pre style={{ 
            display: "flex", 
            flexDirection: "column", 
            margin: 0, 
            font: "12px/1.45 ui-monospace,Menlo,Consolas,monospace" 
          }}>
            {KEY_LINES.map((line, i) => {
              // Highlight comments
              const isComment = line.trim().startsWith("!");
              return (
                <div
                  key={i}
                  style={{
                    color: isComment ? "#16a34a" : "inherit",
                    fontWeight: isComment ? "bold" : "normal",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: "4px",
                  }}
                  className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(line);
                  }}
                  title="Click to copy"
                >
                  <CopyLine text={line} />
                </div>
              );
            })}
          </pre>
        </div>
      </details>
    </div>
  );
}