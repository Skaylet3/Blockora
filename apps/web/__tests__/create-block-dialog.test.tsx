import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateBlockDialog } from "@/features/create-block";

describe("CreateBlockDialog — form validation (US4)", () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submission and shows title error when title is empty", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Content"), "Some content");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission and shows content error when content is empty", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Title"), "Some Title");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(screen.getByText("Content is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the correct data when title and content are provided", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Title"), "Valid Title");
    await user.type(screen.getByLabelText("Content"), "Valid content");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Valid Title",
        content: "Valid content",
      })
    );
  });

  it("shows both errors when title and content are both empty", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Content is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears title error when user starts typing in the title field", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: "Create Block" }));
    expect(screen.getByText("Title is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Title"), "A");
    expect(screen.queryByText("Title is required.")).not.toBeInTheDocument();
  });

  it("clears content error when user starts typing in the content field", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: "Create Block" }));
    expect(screen.getByText("Content is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Content"), "A");
    expect(screen.queryByText("Content is required.")).not.toBeInTheDocument();
  });

  it("calls onClose after successful submission", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Title"), "Title");
    await user.type(screen.getByLabelText("Content"), "Content");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not render content when open is false", () => {
    render(
      <CreateBlockDialog open={false} onClose={onClose} onSubmit={onSubmit} />
    );

    expect(screen.queryByText("Create new block")).not.toBeInTheDocument();
  });

  it("keeps dialog open when onSubmit throws an error", async () => {
    const failingSubmit = vi.fn().mockRejectedValue(new Error("API error"));
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={failingSubmit} />
    );

    await user.type(screen.getByLabelText("Title"), "Title");
    await user.type(screen.getByLabelText("Content"), "Content");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(failingSubmit).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("passes parsed tags from comma-separated input", async () => {
    const user = userEvent.setup();
    render(
      <CreateBlockDialog open onClose={onClose} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Title"), "Title");
    await user.type(screen.getByLabelText("Content"), "Content");
    await user.type(screen.getByLabelText("Tags"), "React, UI, Api");
    await user.click(screen.getByRole("button", { name: "Create Block" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["react", "ui", "api"],
      })
    );
  });
});
