import { useState } from 'react';
import Modal from './Modal';
import { canEditBoard } from '../utils/permissions';

function getInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

export default function BoardMembersModal({
    board,
    user,
    onAdd,
    onRemove,
    onClose,
}) {
    const [username, setUsername] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState('');

    const canManage = canEditBoard(user, board);
    const members = board.members || [];

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            await onAdd({ username: username.trim() });
            setUsername('');
        } catch (e) {
            setError(
                e?.response?.data?.detail || 'Не удалось добавить участника'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (member) => {
        setRemovingId(member.user_id);
        setError('');
        try {
            await onRemove(member.user_id);
        } catch (e) {
            setError(
                e?.response?.data?.detail || 'Не удалось удалить участника'
            );
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Modal title="Участники доски" onClose={onClose}>
            <div className="members">
                <ul className="members__list">
                    {members.map((m) => (
                        <li key={m.user_id} className="members__item">
                            <div className="members__avatar">
                                {getInitial(m.username)}
                            </div>
                            <div className="members__info">
                                <div className="members__username">
                                    {m.username}
                                    {m.is_owner && (
                                        <span className="members__badge members__badge--owner">
                                            владелец
                                        </span>
                                    )}
                                    {!m.is_owner && m.role === 'admin' && (
                                        <span className="members__badge">админ доски</span>
                                    )}
                                </div>
                                <div className="members__email">{m.email}</div>
                            </div>

                            {canManage && !m.is_owner && (
                                <button
                                    type="button"
                                    className="members__remove"
                                    disabled={removingId === m.user_id}
                                    onClick={() => handleRemove(m)}
                                    title="Удалить из доски"
                                >
                                    {removingId === m.user_id ? '…' : '🗑'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                {canManage && (
                    <form className="members__add" onSubmit={handleAdd}>
                        <input
                            className="form__input"
                            type="text"
                            placeholder="Имя пользователя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            className="btn"
                            disabled={submitting || !username.trim()}
                        >
                            {submitting ? 'Добавляем…' : 'Добавить'}
                        </button>
                    </form>
                )}

                {error && <div className="form__error">{error}</div>}
            </div>
        </Modal>
    );
}