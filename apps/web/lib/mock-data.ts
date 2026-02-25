import type { Block } from "./types";

export const mockBlocks: Block[] = [
  {
    id: "1",
    title: "React Best Practices",
    content:
      "Always use functional components with hooks. Keep components small and focused. Extract custom hooks for reusable logic. Avoid prop drilling by using context or state management.",
    type: "Note",
    tags: ["react", "frontend", "development"],
    status: "active",
    updatedAt: "2026-02-20T00:00:00Z",
    createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Design System Structure",
    content:
      "Create a consistent design system with tokens for colors, spacing, and typography. Document component variants and usage guidelines. Ensure all components are accessible.",
    type: "Idea",
    tags: ["design", "ui", "planning"],
    status: "active",
    updatedAt: "2026-02-21T00:00:00Z",
    createdAt: "2026-02-16T00:00:00Z",
  },
  {
    id: "3",
    title: "API Error Handling Pattern",
    content:
      "try {\n  const response = await fetch('/api/data');\n  if (!response.ok) throw new Error('Failed to fetch');\n  const data = await response.json();\n  return data;\n} catch (err) {\n  console.error(err);\n}",
    type: "Snippet",
    tags: ["javascript", "api", "error-handling"],
    status: "active",
    updatedAt: "2026-02-18T00:00:00Z",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "4",
    title: "Implement Dark Mode",
    content:
      "Add theme switching capability to the application. Use CSS variables for easy theme swapping. Persist preference in localStorage and respect system preference via prefers-color-scheme.",
    type: "Task",
    tags: ["feature", "ui", "enhancement"],
    status: "active",
    updatedAt: "2026-02-22T00:00:00Z",
    createdAt: "2026-02-17T00:00:00Z",
  },
  {
    id: "5",
    title: "Database Migration Strategy",
    content:
      "Plan for zero-downtime migrations. Always make schema changes backward compatible. Use feature flags for gradual rollout. Keep rollback scripts ready for each migration.",
    type: "Note",
    tags: ["database", "devops", "planning"],
    status: "active",
    updatedAt: "2026-02-17T00:00:00Z",
    createdAt: "2026-02-12T00:00:00Z",
  },
  {
    id: "6",
    title: "User Onboarding Flow",
    content:
      "Step 1: Welcome screen with value proposition. Step 2: Quick tutorial (skippable). Step 3: Create first block. Keep it minimal. Show immediate value within 60 seconds of signup.",
    type: "Idea",
    tags: ["ux", "product", "planning"],
    status: "active",
    updatedAt: "2026-02-23T00:00:00Z",
    createdAt: "2026-02-18T00:00:00Z",
  },
  {
    id: "7",
    title: "Performance Optimization Notes",
    content:
      "Use React.memo for expensive renders. Virtualize long lists with react-window. Code-split routes with dynamic imports. Profile with React DevTools before optimizing.",
    type: "Note",
    tags: ["react", "performance", "frontend"],
    status: "active",
    updatedAt: "2026-02-19T00:00:00Z",
    createdAt: "2026-02-14T00:00:00Z",
  },
  {
    id: "8",
    title: "TypeScript Utility Types",
    content:
      "Partial<T> makes all properties optional. Required<T> makes all required. Pick<T, K> selects specific keys. Omit<T, K> removes keys. Record<K, V> creates a mapped type.",
    type: "Snippet",
    tags: ["typescript", "javascript", "development"],
    status: "active",
    updatedAt: "2026-02-24T00:00:00Z",
    createdAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "9",
    title: "Testing Strategy",
    content:
      "Unit test pure functions and hooks. Integration test critical user flows. E2E test core journeys only. Aim for 80% coverage on business logic, not UI boilerplate.",
    type: "Note",
    tags: ["testing", "development", "quality"],
    status: "active",
    updatedAt: "2026-02-16T00:00:00Z",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "10",
    title: "Authentication Flow Design",
    content:
      "Use JWT with refresh token rotation. Store access tokens in memory, refresh tokens in httpOnly cookies. Implement silent refresh before expiry. Add rate limiting on auth endpoints.",
    type: "Task",
    tags: ["security", "backend", "api"],
    status: "active",
    updatedAt: "2026-02-25T00:00:00Z",
    createdAt: "2026-02-21T00:00:00Z",
  },
  {
    id: "11",
    title: "CSS Grid Layout System",
    content:
      "const grid = `\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n`;\n// Responsive without media queries",
    type: "Snippet",
    tags: ["css", "frontend", "ui"],
    status: "active",
    updatedAt: "2026-02-13T00:00:00Z",
    createdAt: "2026-02-08T00:00:00Z",
  },
  {
    id: "12",
    title: "Color Palette System",
    content:
      "Define semantic color tokens: primary, secondary, muted, accent, destructive. Each token needs a foreground pair. Use HSL for easy lightness manipulation across themes.",
    type: "Idea",
    tags: ["design", "ui", "branding"],
    status: "active",
    updatedAt: "2026-02-14T00:00:00Z",
    createdAt: "2026-02-09T00:00:00Z",
  },
  {
    id: "13",
    title: "Old Routing Architecture",
    content:
      "Legacy page-based routing with getServerSideProps. Migrated to App Router in Feb 2026. Keeping this for reference during the transition period.",
    type: "Note",
    tags: ["react", "frontend", "legacy"],
    status: "archived",
    updatedAt: "2026-02-10T00:00:00Z",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "14",
    title: "Webpack Config Workaround",
    content:
      "Custom webpack config to handle SVG imports. Replaced by next/image and SVGR loader. No longer needed after upgrade to Next.js 16.",
    type: "Snippet",
    tags: ["javascript", "devops", "legacy"],
    status: "archived",
    updatedAt: "2026-02-08T00:00:00Z",
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "15",
    title: "MVP Feature Backlog",
    content:
      "Initial feature list from Q4 2025 planning. Most items completed. Archive after Q1 2026 review. See updated backlog in Notion for current state.",
    type: "Task",
    tags: ["planning", "product", "legacy"],
    status: "archived",
    updatedAt: "2026-02-05T00:00:00Z",
    createdAt: "2026-01-10T00:00:00Z",
  },
];

export async function getMockBlocks(): Promise<Block[]> {
  // Simulates server-side data fetch (runs on server during SSR)
  return mockBlocks;
}

export function getAllTags(blocks: Block[]): string[] {
  const tags = new Set<string>();
  blocks.forEach((block) => block.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
