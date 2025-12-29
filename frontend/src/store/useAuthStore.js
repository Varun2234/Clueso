import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useAuthStore handles the global authentication state.
 * It uses the persist middleware to keep the user logged in 
 * across page refreshes by syncing with localStorage.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // --- State ---
      user: null,
      token: null,
      isAuthenticated: false,

      // --- Actions ---
      
      /**
       * Sets user data and token upon successful login/signup
       * @param {Object} user - The user object from the backend
       * @param {string} token - The JWT access token
       */
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),

      /**
       * Updates only the user profile information
       */
      setUser: (user) => set({ user }),

      /**
       * Clears the store and logs the user out
       */
      logout: () => {
        // Clear local state
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        // Clear persistence manually if needed
        localStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage', // Key name for localStorage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage
    }
  )
);