import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateBlockDialog } from "@/components/create-block-dialog";

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
});
