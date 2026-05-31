import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import RegistroPage from "../page";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: vi.fn() },
  })),
}));

describe("RegistroPage", () => {
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue({
      auth: { signUp: mockSignUp },
    } as never);
  });

  it("renders registration form correctly", () => {
    render(<RegistroPage />);
    expect(screen.getByRole("heading", { name: /Crear Cuenta/i })).toBeDefined();
    expect(screen.getByPlaceholderText("Ana García")).toBeDefined();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeDefined();
    expect(screen.getByPlaceholderText("••••••••")).toBeDefined();
  });

  it("calls supabase.auth.signUp on submit", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "123", email: "test@example.com" } }, error: null });
    render(<RegistroPage />);
    fireEvent.change(screen.getByPlaceholderText("Ana García"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Crear Cuenta/i }));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com", password: "password123",
        options: { data: { full_name: "Test User" } },
      });
    });
  });

  it("shows success message on registration success", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "123" } }, error: null });
    render(<RegistroPage />);
    fireEvent.change(screen.getByPlaceholderText("Ana García"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Crear Cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText("¡Cuenta creada!")).toBeDefined();
    });
  });
});
