import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Subtopic } from "@/lib/topics";
import type { LabSnapshot } from "./use-lab-snapshots";

export const DOC_TITLE = "CCNA Notes";

export type ExportOptions = {
  pageSize: "A4" | "LETTER";
  orientation: "portrait" | "landscape";
  cover: boolean;
  toc: boolean;
  quickRef: boolean;
  diagrams: boolean;
  breakPerSubtopic: boolean;
  labs: boolean;
  answerKey: boolean;
};

export type ExportGroup = {
  slug: string;
  number: string;
  title: string;
  pages: Subtopic[];
};

type Block = Subtopic["blocks"][number];

/* ───────── fonts ───────── */
const origin = typeof window !== "undefined" ? window.location.origin : "";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${origin}/fonts/Inter-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/Inter-Bold.ttf`, fontWeight: 700 },
  ],
});
Font.register({
  family: "Mono",
  src: `${origin}/fonts/JetBrainsMono-Regular.ttf`,
});
// no mid-word hyphenation
Font.registerHyphenationCallback((word) => [word]);

/* ───────── images ───────── */
const IMG_OK = /\.(png|jpe?g)$/i;
const imgCache = new Map<string, boolean>();

/** Returns the set of diagram srcs that exist and are PNG/JPG (react-pdf crashes on bad images). */
export async function findUsableImages(groups: ExportGroup[]) {
  const srcs = new Set<string>();
  groups.forEach((g) =>
    g.pages.forEach((p) => p.diagrams?.forEach((d) => srcs.add(d.src))),
  );
  const ok = new Set<string>();
  await Promise.all(
    [...srcs].map(async (src) => {
      if (!IMG_OK.test(src)) return;
      if (!imgCache.has(src)) {
        try {
          const r = await fetch(src, { method: "HEAD" });
          imgCache.set(src, r.ok);
        } catch {
          imgCache.set(src, false);
        }
      }
      if (imgCache.get(src)) ok.add(src);
    }),
  );
  return ok;
}

/* ───────── styles ───────── */
const INK = "#16181d";
const MUTED = "#6b7280";
const LINE = "#d4d4d8";
const ACCENT = "#1d4ed8";

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    lineHeight: 1.5,
    color: INK,
    paddingTop: 40,
    paddingBottom: 58,
    paddingHorizontal: 44,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 6,
  },

  coverPage: { fontFamily: "Inter", padding: 60, justifyContent: "center" },
  coverBar: { width: 56, height: 5, backgroundColor: ACCENT, marginBottom: 18 },
  coverTitle: { fontSize: 38, fontWeight: 700, marginBottom: 8 },
  coverMeta: { fontSize: 12, color: MUTED },

  tocTitle: { fontSize: 20, fontWeight: 700, marginBottom: 14 },
  tocTopic: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 3 },
  tocSub: { fontSize: 9.5, color: "#374151", marginLeft: 14, marginBottom: 2 },
  link: { color: "inherit", textDecoration: "none" },

  topicWrap: { marginBottom: 6 },
  topicLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    color: ACCENT,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  topicTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },

  sub: { marginBottom: 18 },
  h2: { fontSize: 15, fontWeight: 700, marginBottom: 3, marginTop: 4 },
  desc: { fontSize: 9.5, color: MUTED, marginBottom: 8 },
  h3: { fontSize: 11.5, fontWeight: 700, marginTop: 9, marginBottom: 3 },
  p: { marginBottom: 5 },

  li: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, color: ACCENT, fontWeight: 700 },
  liText: { flex: 1 },

  codeBox: {
    backgroundColor: "#f4f4f5",
    borderWidth: 0.75,
    borderColor: LINE,
    borderRadius: 3,
    padding: 7,
    marginBottom: 7,
    marginTop: 2,
  },
  codeLine: { fontFamily: "Mono", fontSize: 8.2, lineHeight: 1.4 },

  table: { borderWidth: 0.75, borderColor: LINE, marginBottom: 8 },
  tr: { flexDirection: "row" },
  th: {
    flexBasis: 0,
    padding: 4,
    fontWeight: 700,
    fontSize: 9,
    backgroundColor: "#eef2ff",
    borderRightWidth: 0.5,
    borderRightColor: LINE,
  },
  td: {
    flexBasis: 0,
    padding: 4,
    fontSize: 9,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    borderRightWidth: 0.5,
    borderRightColor: LINE,
  },

  qrBox: {
    borderWidth: 0.75,
    borderColor: ACCENT,
    borderRadius: 3,
    padding: 7,
    marginTop: 6,
    marginBottom: 8,
  },
  qrTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  qrRow: { flexDirection: "row", marginBottom: 2 },
  qrLabel: { width: "28%", fontWeight: 700, fontSize: 9 },
  qrValue: { flex: 1, fontFamily: "Mono", fontSize: 8.5 },

    fig: { marginTop: 4, marginBottom: 10 },
  figBox: { width: "100%", height: 300 },
  figImg: { width: "100%", height: "100%", objectFit: "contain" },
  figCap: { fontSize: 8.5, color: MUTED, marginTop: 3, textAlign: "center" },

  labHead: { fontSize: 11.5, fontWeight: 700, marginTop: 10, marginBottom: 4, color: ACCENT },
  devBox: { borderWidth: 0.75, borderColor: LINE, borderRadius: 3, marginBottom: 6 },
  devTitle: { backgroundColor: "#eef2ff", padding: 4, fontSize: 9, fontWeight: 700 },
  keyRow: { flexDirection: "row", paddingHorizontal: 6, paddingVertical: 1 },
  keyCmd: { fontFamily: "Mono", fontSize: 8, flex: 1 },
  keyNote: { fontSize: 7.5, color: MUTED, width: "30%", textAlign: "right" },
});

/* ───────── blocks ───────── */
function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return (
        <Text style={s.h3} minPresenceAhead={40}>
          {block.text}
        </Text>
      );

    case "paragraph":
      return <Text style={s.p}>{block.text}</Text>;

    case "bullets":
      return (
        <View style={{ marginBottom: 5 }}>
          {block.items.map((item, i) => (
            <View key={i} style={s.li} wrap={false}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.liText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "code": {
      const lines = block.code.replace(/\t/g, "    ").replace(/\n+$/, "").split("\n");
      return (
        <View style={s.codeBox}>
          {lines.map((l, i) => (
            <Text key={i} style={s.codeLine}>
              {l.replace(/^ +/, (m) => "\u00A0".repeat(m.length)) || "\u00A0"}
            </Text>
          ))}
        </View>
      );
    }

    case "table": {
      // column width ∝ longest cell, clamped, so wide columns get more room
      const weights = block.headers.map((h, c) => {
        const longest = Math.max(
          String(h).length,
          ...block.rows.map((r) => String(r[c] ?? "").length),
        );
        return Math.min(Math.max(longest, 6), 40);
      });
      return (
        <View style={s.table}>
          <View style={s.tr} wrap={false}>
            {block.headers.map((h, c) => (
              <Text key={c} style={[s.th, { flexGrow: weights[c] }]}>
                {String(h)}
              </Text>
            ))}
          </View>
          {block.rows.map((row, r) => (
            <View key={r} style={s.tr} wrap={false}>
              {row.map((cell, c) => (
                <Text key={c} style={[s.td, { flexGrow: weights[c] }]}>
                  {String(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    }

    default:
      return null;
  }
}

/* ───────── lab section ───────── */
function LabSection({ snap, options }: { snap: LabSnapshot; options: ExportOptions }) {
  const { data, image, ratio } = snap;
  const nb = (l: string) => l.replace(/^ +/, (m) => "\u00A0".repeat(m.length * 2)) || "\u00A0";

  return (
    <View>
      {options.labs && image && (
        <View style={s.fig}>
          <Text style={s.labHead} minPresenceAhead={80}>Lab topology</Text>
          <Image src={image} style={{ width: "100%", aspectRatio: ratio }} />
        </View>
      )}

      {options.answerKey && (
        <>
          <Text style={s.labHead} minPresenceAhead={50}>Answer key</Text>
          {data.answerKey.map((d) => (
            <View key={d.id + (d.title ?? "")} style={s.devBox}>
              <Text style={s.devTitle} minPresenceAhead={30}>{d.title ?? d.id}</Text>
              {d.lines.map((l, i) => (
                <View key={i} style={s.keyRow} wrap={false}>
                  <Text style={s.keyCmd}>{nb(l.cmd)}</Text>
                  {l.note ? <Text style={s.keyNote}>{l.note}</Text> : null}
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

/* ───────── document ───────── */
export function PdfDocument({
  groups,
  options,
  usableImages,
  labs,
}: {
  groups: ExportGroup[];
  options: ExportOptions;
  usableImages: Set<string>;
  labs: Record<string, LabSnapshot>;
}) {
  const { pageSize, orientation } = options;
  const total = groups.reduce((n, g) => n + g.pages.length, 0);

  return (
    <Document title={DOC_TITLE} subject="Study notes">
      {options.cover && (
        <Page size={pageSize} orientation={orientation} style={s.coverPage}>
          <View style={s.coverBar} />
          <Text style={s.coverTitle}>{DOC_TITLE}</Text>
          <Text style={s.coverMeta}>
            {total} {total === 1 ? "page" : "pages"} · {groups.length}{" "}
            {groups.length === 1 ? "topic" : "topics"}
          </Text>
          <Text style={[s.coverMeta, { marginTop: 4 }]}>
            {new Date().toLocaleDateString()}
          </Text>
        </Page>
      )}

      {options.toc && (
        <Page size={pageSize} orientation={orientation} style={s.page}>
          <Text style={s.tocTitle}>Contents</Text>
          {groups.map((g) => (
            <View key={g.slug}>
              <Text style={s.tocTopic}>
                <Link src={`#t-${g.slug}`} style={s.link}>
                  {g.number}  {g.title}
                </Link>
              </Text>
              {g.pages.map((p) => (
                <Text key={p.slug} style={s.tocSub}>
                  <Link src={`#s-${p.slug}`} style={s.link}>
                    {p.title}
                  </Link>
                </Text>
              ))}
            </View>
          ))}
          <PageFooter />
        </Page>
      )}

      {groups.map((g) => (
        <Page
          key={g.slug}
          size={pageSize}
          orientation={orientation}
          style={s.page}
        >
          <View style={s.topicWrap}>
            <Text style={s.topicLabel}>Topic {g.number}</Text>
            <Text
              id={`t-${g.slug}`}
              style={s.topicTitle}
  {...({ bookmark: { title: `${g.number} ${g.title}`, expanded: true } } as object)}            >
              {g.title}
            </Text>

            {g.pages.map((sub, si) => (
              <View
                key={sub.slug}
                style={s.sub}
                break={options.breakPerSubtopic && si > 0}
              >
                <Text
                  id={`s-${sub.slug}`}
                  style={s.h2}
  {...({ bookmark: { title: sub.title } } as object)}                >
                  {sub.title}
                </Text>
                {sub.description ? (
                  <Text style={s.desc}>{sub.description}</Text>
                ) : null}

                {sub.blocks.map((b, i) => (
                  <RenderBlock key={i} block={b} />
                ))}

                {options.quickRef && sub.quickReference?.length > 0 && (
                  <View style={s.qrBox}>
                    <Text style={s.qrTitle}>Quick reference</Text>
                    {sub.quickReference.map((q, i) => (
                      <View key={i} style={s.qrRow} wrap={false}>
                        <Text style={s.qrLabel}>{q.label}</Text>
                        <Text style={s.qrValue}>{q.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {options.diagrams &&
                  sub.diagrams
                    ?.filter((d) => usableImages.has(d.src))
                    .map((d) => (
                      <View key={d.src} style={s.fig}>
                        <View style={s.figBox}>
                          <Image src={`${origin}${d.src}`} style={s.figImg} />
                        </View>
                        {d.caption ? (
                          <Text style={s.figCap}>{d.caption}</Text>
                        ) : null}
                      </View>
                    ))}

                {labs[sub.slug] && (options.labs || options.answerKey) && (
                  <LabSection snap={labs[sub.slug]} options={options} />
                )}
              </View>
            ))}
          </View>
          <PageFooter />
        </Page>
      ))}
    </Document>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text>{DOC_TITLE}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}