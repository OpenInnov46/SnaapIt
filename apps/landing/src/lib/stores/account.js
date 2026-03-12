import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export const user = writable(null);
export const session = writable(null);

export const authStore = {
    login: (loginData) => {
        user.set(loginData.user);
        session.set(loginData.session);
        if (browser) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
            localStorage.setItem('session', JSON.stringify(loginData.session));
        }
    },

    logout: () => {
        user.set(null);
        session.set(null);
        if (browser) {
            localStorage.removeItem('user');
            localStorage.removeItem('session');
        }
    },
};

// Initialize from localStorage on load
if (browser) {
    const storedUser = localStorage.getItem('user');
    const storedSession = localStorage.getItem('session');
    if (storedUser && storedSession) {
        try {
            user.set(JSON.parse(storedUser));
            session.set(JSON.parse(storedSession));
        } catch (error) {
            console.error('Failed to parse stored data:', error);
            authStore.logout();
        }
    }
}

export const isAuthenticated = derived(user, ($user) => !!$user);
