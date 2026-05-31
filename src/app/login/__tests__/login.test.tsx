import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LoginPage from "../page";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: vi.fn() },
  })),
}));

describe("LoginPage", () => {
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword: mockSignIn },
    } as never);
  });

  it("renders login form correctly", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /Iniciar Sesión/i })).toBeDefined();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeDefined();
    expect(screen.getByPlaceholderText("••••••••")).toBeDefined();
  });

  it("manages form input state", () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText("tu@email.com") as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("calls supabase.auth.signInWithPassword on submit", async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Iniciar Sesión/i }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "test@example.com", password: "password123" });
    });
  });

  it("displays error message on login failure", async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: "Credenciales inválidas" } });
    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "error@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Iniciar Sesión/i }));
    await waitFor(() => {
      // The page catches plain objects as "Error al iniciar sesión"
      expect(screen.getByText("Error al iniciar sesión")).toBeDefined();
    });
  });
});
