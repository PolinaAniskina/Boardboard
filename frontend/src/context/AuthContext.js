import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import {
    clearAuth,
    getToken,
    getUser,
    setToken,
    setUser,
} from '../api/client';
import { isTokenExpired, parseJwt } from '../utils/jwt';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(() => getToken());
    const [user, setUserState] = useState(() => getUser());
    const [loading, setLoading] = useState(false);

    // Если токен протух — чистим при старте
    useEffect(() => {
        const t = getToken();
        if (t && isTokenExpired(t)) {
            clearAuth();
            setTokenState(null);
            setUserState(null);
        }
    }, []);

    const applyToken = useCallback((accessToken, userInfo) => {
        setToken(accessToken);
        setTokenState(accessToken);

        const payload = parseJwt(accessToken) || {};
        const merged = {
            id: userInfo?.id ?? Number(payload.sub),
            username: userInfo?.username ?? '',
            email: userInfo?.email ?? '',
            roles: payload.roles ?? ['member'],
        };
        setUser(merged);
        setUserState(merged);
    }, []);

    const login = useCallback(
        async ({ username, password }) => {
            setLoading(true);
            try {
                const { access_token } = await authApi.login({ username, password });
                // UserOut бэк на логине не отдаёт, поэтому username берём из формы,
                // id и roles — из payload токена
                applyToken(access_token, { username });
                return { ok: true };
            } catch (e) {
                const detail =
                    e?.response?.data?.detail || 'Не удалось войти. Попробуйте ещё раз.';
                return { ok: false, error: detail };
            } finally {
                setLoading(false);
            }
        },
        [applyToken]
    );

    const register = useCallback(
        async ({ username, email, password }) => {
            setLoading(true);
            try {
                const userOut = await authApi.register({ username, email, password });
                // После регистрации сразу логиним
                const { access_token } = await authApi.login({ username, password });
                applyToken(access_token, {
                    id: userOut.id,
                    username: userOut.username,
                    email: userOut.email,
                });
                return { ok: true };
            } catch (e) {
                const detail =
                    e?.response?.data?.detail ||
                    'Не удалось зарегистрироваться. Проверьте данные.';
                return { ok: false, error: detail };
            } finally {
                setLoading(false);
            }
        },
        [applyToken]
    );

    const logout = useCallback(() => {
        clearAuth();
        setTokenState(null);
        setUserState(null);
    }, []);

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            isAdmin: Boolean(user?.roles?.includes('admin')),
            loading,
            login,
            register,
            logout,
        }),
        [token, user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}