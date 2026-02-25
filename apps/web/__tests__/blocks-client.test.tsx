import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlocksClient } from "@/components/blocks-client";
import { createBlock, resetSeq } from "./fixtures";
import type { Block } from "@/lib/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const DASHBOARD_BLOCKS: Block[] = [
  createBlock({
    id: "b1",
    title: "React Hooks Guide",
    content: "useState and useEffect patterns",
    type: "Note",
    tags: ["react"],
    status: "active",
  }),
  createBlock({
    id: "b2",
    title: "Deploy Checklist",
    content: "Steps before going to production",
    type: "Task",
    tags: ["devops"],
    status: "active",
  }),
  createBlock({
    id: "b3",
    title: "Auth Snippet",
    content: "JWT decode helper function",
    type: "Snippet",
    tags: ["auth", "jwt"],
    status: "active",
  }),
  createBlock({
    id: "b4",
    title: "Old Note",
    content: "This note was archived",
    type: "Note",
    tags: [],
    status: "archived",
  }),
  createBlock({
    id: "b5",
    title: "Completed Task",
    content: "Already done",
    type: "Task",
    tags: ["devops"],
    status: "archived",
  }),
];

beforeEach(() => {
  resetSeq();
});

describe("BlocksClient — filtering and search (US3)", () => {
  it("search by query narrows results to matching blocks", async () => {
    const user = userEvent.setup();
    render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />);

    await user.type(
      screen.getByPlaceholderText("Search blocks..."),
      "React"
    );

    expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
    expect(screen.queryByText("Deploy Checklist")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Snippet")).not.toBeInTheDocument();
  });

  it("type filter shows only blocks of the selected type", async () => {
    const user = userEvent.setup();
    render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />);

    // First combobox is the type filter (has "All Types" as first option)
    const typeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(typeSelect, "Note");

    expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
    expect(screen.queryByText("Deploy Checklist")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Snippet")).not.toBeInTheDocument();
  });

  it("Archived tab shows only archived blocks", async () => {
    const user = userEvent.setup();
    render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />);

    await user.click(screen.getByRole("button", { name: /Archived/ }));

    expect(screen.getByText("Old Note")).toBeInTheDocument();
    expect(screen.getByText("Completed Task")).toBeInTheDocument();
    expect(screen.queryByText("React Hooks Guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Deploy Checklist")).not.toBeInTheDocument();
  });

  it("Clear filters restores all active blocks after a no-match search", async () => {
    const user = userEvent.setup();
    render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />);

    await user.type(
      screen.getByPlaceholderText("Search blocks..."),
      "zzznomatch"
    );

    expect(
      screen.getByText("No blocks match your filters")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
    expect(screen.getByText("Deploy Checklist")).toBeInTheDocument();
    expect(screen.getByText("Auth Snippet")).toBeInTheDocument();
  });
});

describe("BlocksClient — edge cases", () => {
  it("shows empty state when search matches zero blocks", async () => {
    const user = userEvent.setup();
    render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />);

    await user.type(
      screen.getByPlaceholderText("Search blocks..."),
      "zzznomatch"
    );

    expect(
      screen.getByText("No blocks match your filters")
    ).toBeInTheDocument();
    expect(screen.queryByText("React Hooks Guide")).not.toBeInTheDocument();
  });

  it("shows empty active state when all blocks are archived", () => {
    const allArchived: Block[] = DASHBOARD_BLOCKS.map((b) => ({
      ...b,
      status: "archived" as const,
    }));
    render(<BlocksClient initialBlocks={allArchived} />);

    // Active tab is default — no active blocks → empty state
    expect(screen.getByText("No blocks yet")).toBeInTheDocument();
  });
});
