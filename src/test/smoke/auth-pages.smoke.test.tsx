import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

const renderWithAuth = (ui: ReactNode) => {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
};

describe('auth pages smoke', () => {
  test('login page renders and validates required fields', async () => {
    renderWithAuth(<Login />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('register page renders and validates password confirmation', async () => {
    renderWithAuth(<Register />);

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'WrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});
