import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export default function RegisterPage() {
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await register(form);
        if (res.ok) navigate('/boards', { replace: true });
        else setError(res.error);
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={onSubmit}>
                <h1 className="auth-card__title">Регистрация</h1>

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
                    Email
                    <input
                        className="auth-card__input"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                </label>

                <label className="auth-card__label">
                    Пароль <span className="auth-card__hint-inline">(от 8 символов)</span>
                    <input
                        className="auth-card__input"
                        type="password"
                        minLength={8}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                </label>

                {error && <div className="auth-card__error">{error}</div>}

                <button className="auth-card__submit" type="submit" disabled={loading}>
                    {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
                </button>

                <div className="auth-card__hint">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </div>
            </form>
        </div>
    );
}