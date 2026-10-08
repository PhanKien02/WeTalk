/* eslint-disable @next/next/no-location-assign-relative-destination */
'use client';

import { COOKIES } from '@/lib/cookieName';
import { clearCookies, getCookie, setCookie } from '@/utils/cookies';
import axios from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;
const TIMEOUT = 10000;
const baseRequest = axios.create({
        baseURL: BASE_URL,
        timeout: TIMEOUT, // Thời gian chờ (ms)

        headers: {
                'Content-Type': 'application/json',
        },
        withCredentials: true,
});

let payloadInterceptor: ((data: unknown) => Promise<unknown>) | null = null;

export function setPayloadInterceptor(fn: (data: unknown) => Promise<unknown>) {
        payloadInterceptor = fn;
}

baseRequest.interceptors.request.use(
        async config => {
                const token = getCookie(COOKIES.ACCESSTOKEN);
                if (token) {
                        config.headers['Authorization'] = `Bearer ${token}`;
                }

                if (payloadInterceptor && !(config as typeof config & { _retry?: boolean })._retry) {
                        try {
                                if (config.data) {
                                        config.data = await payloadInterceptor(config.data);
                                }
                                if (config.params) {
                                        config.params = await payloadInterceptor(config.params);
                                }
                        } catch (err) {
                                console.error('Payload interceptor error:', err);
                        }
                }

                return config;
        },
        error => Promise.reject(error || 'Có lỗi hệ thống vui lòng thử lại')
);

baseRequest.interceptors.response.use(
        res => res,
        async error => {
                const originalRequest = error.config;
                if (!error.response) {
                        return Promise.reject(error);
                }

                if (error.response.status === 401 && !originalRequest._retry) {
                        originalRequest._retry = true;

                        const newToken = await refreshToken();
                        if (newToken) {
                                return baseRequest(originalRequest);
                        } else {
                                return Promise.reject(error.response.data || 'Unauthorized');
                        }
                }
                return Promise.reject(error.response?.data || 'Something went wrong');
        }
);

let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken() {
        if (refreshPromise) {
                return refreshPromise;
        }

        refreshPromise = (async () => {
                try {
                        // Use a separate axios call to avoid the main instance's interceptors
                        const response = await axios.post(
                                `${BASE_URL}/v1/auth/refresh-token`,
                                {},
                                {
                                        withCredentials: true,
                                        headers: {
                                                'Content-Type': 'application/json',
                                        },
                                }
                        );

                        const { data } = response.data;
                        if (data?.accessToken) {
                                setCookie(COOKIES.ACCESSTOKEN, data.accessToken);
                                return data.accessToken as string;
                        }
                        if (response.status === 401) {
                                clearCookies();
                                if (typeof window !== 'undefined') window.location.href = '/login';
                                return null;
                        }
                        return null;
                } catch (error) {
                        console.error('Refresh token failed:', error);
                        clearCookies();
                        if (typeof window !== 'undefined') window.location.href = '/login';
                        return null;
                } finally {
                        refreshPromise = null;
                }
        })();

        return refreshPromise;
}
export default baseRequest;
