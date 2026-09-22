import React, { useState } from 'react';

export const AuthPage = ({ onLogin, onRegister, loading, error }) => {
    const [mode, setMode] = useState('login'); // 'login' или 'register'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError(null);

        if (mode === 'register') {
            if (!username.trim() || !email.trim() || !password.trim()) {
                setLocalError('Заполните все поля');
                return;
            }
            if (password !== confirmPassword) {
                setLocalError('Пароли не совпадают');
                return;
            }
            if (password.length < 6) {
                setLocalError('Пароль должен быть не короче 6 символов');
                return;
            }
            onRegister(username, email, password);
        } else {
            if (!username.trim() || !password.trim()) {
                setLocalError('Введите логин и пароль');
                return;
            }
            onLogin(username, password);
        }
    };

    const displayError = localError || error;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '32px'
            }}>
                {/* Переключатель режимов */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    backgroundColor: '#111',
                    borderRadius: '8px',
                    padding: '4px'
                }}>
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setLocalError(null); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: mode === 'login' ? '#b02b2b' : 'transparent',
                            color: mode === 'login' ? '#fff' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        Вход
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('register'); setLocalError(null); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: mode === 'register' ? '#4caf50' : 'transparent',
                            color: mode === 'register' ? '#fff' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        Регистрация
                    </button>
                </div>

                {/* Заголовок */}
                <h2 style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    textAlign: 'center'
                }}>
                    {mode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
                </h2>
                <p style={{
                    color: '#666',
                    fontSize: '14px',
                    textAlign: 'center',
                    margin: '0 0 24px 0'
                }}>
                    {mode === 'login'
                        ? 'Войдите, чтобы продолжить'
                        : 'Заполните форму ниже'}
                </p>

                {/* Ошибка */}
                {displayError && (
                    <div style={{
                        color: '#ff5252',
                        backgroundColor: 'rgba(183, 28, 28, 0.15)',
                        border: '1px solid rgba(183, 28, 28, 0.3)',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {displayError}
                    </div>
                )}

                {/* Форма */}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="auth-username"
                        name="username"
                        placeholder="Логин"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#111',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#fff',
                            marginBottom: '12px',
                            boxSizing: 'border-box',
                            fontSize: '15px'
                        }}
                    />

                    {mode === 'register' && (
                        <input
                            type="email"
                            id="auth-email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#111',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                color: '#fff',
                                marginBottom: '12px',
                                boxSizing: 'border-box',
                                fontSize: '15px'
                            }}
                        />
                    )}

                    <input
                        type="password"
                        id="auth-password"
                        name="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#111',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#fff',
                            marginBottom: '12px',
                            boxSizing: 'border-box',
                            fontSize: '15px'
                        }}
                    />

                    {mode === 'register' && (
                        <input
                            type="password"
                            id="auth-confirm-password"
                            name="confirm-password"
                            placeholder="Повторите пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#111',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                color: '#fff',
                                marginBottom: '20px',
                                boxSizing: 'border-box',
                                fontSize: '15px'
                            }}
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: mode === 'login' ? '#b02b2b' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading
                            ? 'Подождите...'
                            : mode === 'login'
                                ? 'Войти'
                                : 'Зарегистрироваться'}
                    </button>
                </form>
            </div>
        </div>
    );
};
