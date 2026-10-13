"use strict";

import Cookies from 'js-cookie';

export function setCookie(cookieName: string, data: string) {
        Cookies.set(cookieName, data, {
                secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
                sameSite: 'lax', // ⚠️ cực quan trọng
                path: '/',                // dùng toàn app
        });
}

export function getCookie<T = unknown>(cookieName: string): T | undefined {
        try {
                const cookieValue = Cookies.get(cookieName);
                if (!cookieValue) return undefined;
                // Nếu là string JSON (object/array) thì parse, còn không thì trả về raw string
                try {
                        return JSON.parse(cookieValue) as T;
                } catch {
                        return cookieValue as unknown as T;
                }
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
