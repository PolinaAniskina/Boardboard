import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export default function LoginPage() {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/boards';

    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(form);
        if (res.ok) navigate(from, { replace: true });
        else setError(res.error);
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={onSubmit}>
                <h1 className="auth-card__title">Вход в Boardboard</h1>

                <label className="auth-card__label">
                    Логин
                    <input
                        className="auth-card__input"
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        autoFocus
                    />
                </label>

                <label className="auth-card__label">
                    Пароль
                    <input
                        className="auth-card__input"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                </label>

                {error && <div className="auth-card__error">{error}</div>}

                <button className="auth-card__submit" type="submit" disabled={loading}>
                    {loading ? 'Вход…' : 'Войти'}
                </button>

                <div className="auth-card__hint">
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </div>
            </form>
        </div>
    );
}