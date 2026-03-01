import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import RegistroPage from "./page";
import { createClient } from "@/lib/supabase/client";

// Mock the supabase client
vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(() => ({
        auth: {
            signUp: vi.fn(),
        },
    })),
}));

describe("RegistroPage", () => {
    const mockSignUp = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createClient).mockReturnValue({
            auth: {
                signUp: mockSignUp,
            },
        } as never);
    });

    it("renders registration form correctly", () => {
        render(<RegistroPage />);
        // Buscamos el título específicamente
        expect(screen.getByRole("heading", { name: /Crear Cuenta/i })).toBeDefined();
        expect(screen.getByPlaceholderText("Ana García")).toBeDefined();
        expect(screen.getByPlaceholderText("tu@email.com")).toBeDefined();
        expect(screen.getByPlaceholderText("••••••••")).toBeDefined();
    });

    it("calls supabase.auth.signUp on submit", async () => {
        mockSignUp.mockResolvedValue({
            data: { user: { id: "123", email: "test@example.com" } },
            error: null
        });

        render(<RegistroPage />);
        const nameInput = screen.getByPlaceholderText("Ana García");
        const emailInput = screen.getByPlaceholderText("tu@email.com");
        const passwordInput = screen.getByPlaceholderText("••••••••");
        const submitButton = screen.getByRole("button", { name: /Crear Cuenta/i });

        fireEvent.change(nameInput, { target: { value: "Test User" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
                options: {
                    data: {
                        full_name: "Test User",
                    },
                },
            });
        });
    });

    it("shows success message on registration success", async () => {
        mockSignUp.mockResolvedValue({
            data: { user: { id: "123", email: "test@example.com" } },
            error: null
        });

        render(<RegistroPage />);
        const nameInput = screen.getByPlaceholderText("Ana García");
        const emailInput = screen.getByPlaceholderText("tu@email.com");
        const passwordInput = screen.getByPlaceholderText("••••••••");
        const submitButton = screen.getByRole("button", { name: /Crear Cuenta/i });

        fireEvent.change(nameInput, { target: { value: "Test User" } });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("¡Cuenta creada!")).toBeDefined();
        });
    });
});
