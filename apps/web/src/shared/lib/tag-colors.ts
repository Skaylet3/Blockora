const TAG_COLOR_MAP: Record<string, string> = {
  react: "bg-cyan-100 text-cyan-700",
  javascript: "bg-yellow-100 text-yellow-700",
  typescript: "bg-blue-100 text-blue-700",
  css: "bg-pink-100 text-pink-700",
  html: "bg-orange-100 text-orange-700",
  frontend: "bg-teal-100 text-teal-700",
  backend: "bg-indigo-100 text-indigo-700",
  design: "bg-rose-100 text-rose-700",
  ui: "bg-purple-100 text-purple-700",
  ux: "bg-fuchsia-100 text-fuchsia-700",
  api: "bg-orange-100 text-orange-700",
  database: "bg-amber-100 text-amber-700",
  devops: "bg-green-100 text-green-700",
  testing: "bg-emerald-100 text-emerald-700",
  quality: "bg-lime-100 text-lime-700",
  security: "bg-red-100 text-red-700",
  performance: "bg-lime-100 text-lime-700",
  planning: "bg-sky-100 text-sky-700",
  development: "bg-cyan-100 text-cyan-700",
  feature: "bg-violet-100 text-violet-700",
  enhancement: "bg-teal-100 text-teal-700",
  product: "bg-blue-100 text-blue-700",
  branding: "bg-pink-100 text-pink-700",
  "error-handling": "bg-red-100 text-red-700",
  legacy: "bg-zinc-100 text-zinc-600",
};

const FALLBACK_COLORS = [
  "bg-slate-100 text-slate-700",
  "bg-gray-100 text-gray-700",
  "bg-stone-100 text-stone-700",
  "bg-zinc-100 text-zinc-700",
  "bg-neutral-100 text-neutral-700",
];

export function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (TAG_COLOR_MAP[lower]) return TAG_COLOR_MAP[lower]!;
  // Deterministic fallback based on string hash
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) & 0xffffffff;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]!;
}

export const TYPE_COLORS: Record<string, string> = {
  NOTE: "bg-zinc-100 text-zinc-700",
  TASK: "bg-amber-100 text-amber-700",
  SNIPPET: "bg-violet-100 text-violet-700",
  IDEA: "bg-blue-100 text-blue-700",
};
