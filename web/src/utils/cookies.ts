"use strict";

import Cookies from 'js-cookie';

export function setCookie(cookieName: string, data: unknown) {
        Cookies.set(cookieName, JSON.stringify(data), {
                secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
                sameSite: 'lax', // ⚠️ cực quan trọng
                path: '/',                // dùng toàn app
        });
}

export function getCookie<T = unknown>(cookieName: string): T | undefined {
        try {
                const cookieValue = Cookies.get(cookieName);
                if (!cookieValue) return undefined;

                return JSON.parse(cookieValue);
        } catch (error) {
                console.error('Parse cookie error:', error);
                return undefined;
        }
}

export function removeCookie(cookieName: string) {
        Cookies.remove(cookieName, { path: '/' });
}

export function clearCookies() {
        const cookies = Cookies.get();
        for (const cookieName in cookies) {
                Cookies.remove(cookieName, { path: '/' });
        }
}
