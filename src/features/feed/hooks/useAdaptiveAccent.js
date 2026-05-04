import { useMemo } from "react";

const PALETTE = [
  { name: "cyan", rgb: "34,211,238", soft: "14,165,233" },
  { name: "sky", rgb: "56,189,248", soft: "14,165,233" },
  { name: "teal", rgb: "45,212,191", soft: "20,184,166" },
  { name: "blue", rgb: "59,130,246", soft: "37,99,235" },
  { name: "emerald", rgb: "52,211,153", soft: "16,185,129" },
  { name: "violet", rgb: "139,92,246", soft: "124,58,237" },
  { name: "amber", rgb: "251,191,36", soft: "245,158,11" },
];

function hashString(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function inferPaletteIndex(post) {
  const text = `${post?.image_url || ""} ${post?.media_url || ""} ${post?.content || ""}`.toLowerCase();

  if (/forest|tree|green|woods|mets|puu|luonto/.test(text)) return 4;
  if (/lake|water|river|sea|blue|järvi|vesi|meri/.test(text)) return 1;
  if (/sun|gold|yellow|warm|ilta|aurinko/.test(text)) return 6;
  if (/night|dark|space|violet|purple|yö/.test(text)) return 5;
  if (/ice|snow|winter|cyan|lumi|talvi/.test(text)) return 0;

  return hashString(post?.id || post?.content || "kolehti") % PALETTE.length;
}

export default function useAdaptiveAccent(post) {
  return useMemo(() => {
    const color = PALETTE[inferPaletteIndex(post)] || PALETTE[0];
    return {
      name: color.name,
      style: {
        "--feed-accent": color.rgb,
        "--feed-accent-soft": color.soft,
        "--feed-accent-bg": `rgba(${color.rgb}, 0.12)`,
        "--feed-accent-bg-strong": `rgba(${color.rgb}, 0.28)`,
        "--feed-accent-border": `rgba(${color.rgb}, 0.24)`,
        "--feed-accent-glow": `rgba(${color.rgb}, 0.18)`,
        "--feed-accent-glow-soft": `rgba(${color.rgb}, 0.09)`,
      },
    };
  }, [post?.id, post?.image_url, post?.media_url, post?.content]);
}
