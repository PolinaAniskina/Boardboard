import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    listBoards,
    createBoard,
    updateBoard,
    deleteBoard,
} from '../api/boards';
import BoardCard from '../components/BoardCard';
import BoardFormModal from '../components/BoardFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/boards.css';

export default function BoardsPage() {
    const { user, logout } = useAuth();

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [deleting, setDeleting] = useState(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const loadBoards = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await listBoards();
            setBoards(data);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Не удалось загрузить доски');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    const openCreate = () => {
        setEditing(null);
        setFormError('');
        setFormOpen(true);
    };

    const openEdit = (board) => {
        setEditing(board);
        setFormError('');
        setFormOpen(true);
    };

    const closeForm = () => {
        if (submitting) return;
        setFormOpen(false);
        setEditing(null);
        setFormError('');
    };

    const handleSubmit = async ({ name, description }) => {
        setSubmitting(true);
        setFormError('');
        try {
            if (editing) {
                const updated = await updateBoard(editing.id, { name, description });
                setBoards((prev) =>
                    prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
                );
            } else {
                const created = await createBoard({ name, description });
                setBoards((prev) => [created, ...prev]);
            }
            setFormOpen(false);
            setEditing(null);
        } catch (e) {
            setFormError(
                e?.response?.data?.detail || 'Не удалось сохранить доску'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setDeleteSubmitting(true);
        try {
            await deleteBoard(deleting.id);
            setBoards((prev) => prev.filter((b) => b.id !== deleting.id));
            setDeleting(null);
        } catch (e) {
            alert(e?.response?.data?.detail || 'Не удалось удалить доску');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <div className="boards-page">
            <header className="boards-header">
                <div className="boards-header__brand">Boardboard</div>
                <div className="boards-header__user">
                    <span>{user?.username}</span>
                    {user?.roles?.includes('admin') && (
                        <span className="boards-header__badge">admin</span>
                    )}
                    <button className="btn btn--ghost" onClick={logout}>
                        Выйти
                    </button>
                </div>
            </header>

            <main className="boards-main">
                <div className="boards-toolbar">
                    <h1 className="boards-title">Мои доски</h1>
                    <button className="btn" onClick={openCreate}>
                        + Создать доску
                    </button>
                </div>

                {loading && <div className="muted">Загрузка…</div>}
                {error && <div className="error">{error}</div>}

                {!loading && !error && boards.length === 0 && (
                    <div className="boards-empty">
                        <p className="muted">У вас пока нет досок.</p>
                        <button className="btn" onClick={openCreate}>
                            Создать первую доску
                        </button>
                    </div>
                )}

                {!loading && !error && boards.length > 0 && (
                    <div className="boards-grid">
                        {boards.map((b) => (
                            <BoardCard
                                key={b.id}
                                board={b}
                                onEdit={openEdit}
                                onDelete={setDeleting}
                            />
                        ))}
                    </div>
                )}
            </main>

            {formOpen && (
                <BoardFormModal
                    initial={editing}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                    submitting={submitting}
                    error={formError}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title="Удалить доску?"
                    message={`Доска «${deleting.name}» и все её колонки и карточки будут удалены. Действие необратимо.`}
                    onConfirm={handleDelete}
                    onCancel={() => !deleteSubmitting && setDeleting(null)}
                    submitting={deleteSubmitting}
                />
            )}
        </div>
    );
}