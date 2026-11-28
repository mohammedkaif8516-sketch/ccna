"use client";

import { NcStyles } from "./_shared";
import { EthernetStandards } from "./ethernet-standards-and-speeds-10mbps-to-400gbps/component";
import { TwistedPairLab } from "./twisted-pair-cables-categories-3-5-5e-6-shielding/component";
import { CoaxLab } from "./coaxial-cables/component";
import { QuickReference } from "./quick-reference";
import { FiberLab } from "./fiber-optic-cables-single-mode-multi-mode-transceivers-like-sfp-qsfp/component";
import { ColorCodeLab } from "./color-codes-and-standards-eia-tia-568b/component";
import { CablingLab } from "./cabling-types-straight-through-crossover-auto-mdi-x/component";
import { PoELab } from "./power-over-ethernet-poe/component";
import { CableQuiz } from "./cable-quiz";

/* ───────────────────────── main export (parent page) ───────────────────────── */

export function NetworkCabling() {
  return (
    <div>
      <NcStyles />
      <p className="text-sm text-muted-foreground">
        Copper cables carry electrical signals, fibre carries light. Learn how each is built, how the wires are ordered, which cable connects which devices, and how one cable can even power them.
      </p>
      <EthernetStandards />
      <TwistedPairLab />
      <CoaxLab />
      <QuickReference />
      <FiberLab />
      <ColorCodeLab />
      <CablingLab />
      <PoELab />
      <CableQuiz />
    </div>
  );
}

export default NetworkCabling;
