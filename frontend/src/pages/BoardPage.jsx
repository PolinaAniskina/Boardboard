import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBoardData } from '../hooks/useBoardData';
import { canEditBoard } from '../utils/permissions';
import KanbanDndContext from '../components/dnd/KanbanDndContext';
import KanbanColumn from '../components/KanbanColumn';
import CardFormModal from '../components/CardFormModal';
import ColumnFormModal from '../components/ColumnFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/board.css';

export default function BoardPage() {
    const { boardId } = useParams();
    const { user } = useAuth();
    const {
        board,
        loading,
        error,
        wsStatus,
        addColumn,
        editColumn,
        removeColumn,
        addCard,
        editCard,
        removeCard,
        moveCard,
        reorderColumns,
    } = useBoardData(boardId);

    // --- Состояние формы колонки ---
    const [columnForm, setColumnForm] = useState({
        open: false,
        editing: null,
    });
    const [columnSubmitting, setColumnSubmitting] = useState(false);
    const [columnError, setColumnError] = useState('');
    const [deletingColumn, setDeletingColumn] = useState(null);
    const [deleteColumnSubmitting, setDeleteColumnSubmitting] = useState(false);

    // --- Состояние формы карточки ---
    const [cardForm, setCardForm] = useState({
        open: false,
        editing: null,
        defaultColumnId: null,
    });
    const [cardSubmitting, setCardSubmitting] = useState(false);
    const [cardError, setCardError] = useState('');
    const [deletingCard, setDeletingCard] = useState(null);
    const [deleteCardSubmitting, setDeleteCardSubmitting] = useState(false);

    // --- Колонки: обработчики ---
    const openCreateColumn = () => {
        setColumnError('');
        setColumnForm({ open: true, editing: null });
    };
    const openEditColumn = (column) => {
        setColumnError('');
        setColumnForm({ open: true, editing: column });
    };
    const closeColumnForm = () => {
        if (columnSubmitting) return;
        setColumnForm({ open: false, editing: null });
        setColumnError('');
    };
    const handleColumnSubmit = async ({ name }) => {
        setColumnSubmitting(true);
        setColumnError('');
        try {
            if (columnForm.editing) {
                await editColumn(columnForm.editing.id, { name });
            } else {
                await addColumn({ name });
            }
            setColumnForm({ open: false, editing: null });
        } catch (e) {
            setColumnError(
                e?.response?.data?.detail || 'Не удалось сохранить колонку'
            );
        } finally {
            setColumnSubmitting(false);
        }
    };
    const handleDeleteColumn = async () => {
        if (!deletingColumn) return;
        setDeleteColumnSubmitting(true);
        try {
            await removeColumn(deletingColumn.id);
            setDeletingColumn(null);
        } catch (e) {
            alert(e?.response?.data?.detail || 'Не удалось удалить колонку');
        } finally {
            setDeleteColumnSubmitting(false);
        }
    };

    // --- Карточки: обработчики ---
    const openCreateCard = (column) => {
        setCardError('');
        setCardForm({
            open: true,
            editing: null,
            defaultColumnId: column?.id ?? null,
        });
    };
    const openEditCard = (card) => {
        setCardError('');
        setCardForm({ open: true, editing: card, defaultColumnId: null });
    };
    const closeCardForm = () => {
        if (cardSubmitting) return;
        setCardForm({ open: false, editing: null, defaultColumnId: null });
        setCardError('');
    };
    const handleCardSubmit = async (payload) => {
        setCardSubmitting(true);
        setCardError('');
        try {
            if (cardForm.editing) {
                await editCard(cardForm.editing.id, payload);
            } else {
                await addCard(payload);
            }
            setCardForm({ open: false, editing: null, defaultColumnId: null });
        } catch (e) {
            setCardError(
                e?.response?.data?.detail || 'Не удалось сохранить карточку'
            );
        } finally {
            setCardSubmitting(false);
        }
    };
    const handleDeleteCard = async () => {
        if (!deletingCard) return;
        setDeleteCardSubmitting(true);
        try {
            await removeCard(deletingCard.id);
            setDeletingCard(null);
        } catch (e) {
            alert(e?.response?.data?.detail || 'Не удалось удалить карточку');
        } finally {
            setDeleteCardSubmitting(false);
        }
    };

    // --- Рендер ---
    if (loading) {
        return (
            <div className="board-page board-page--center">
                <div className="muted">Загрузка доски…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="board-page board-page--center">
                <div className="error">{error}</div>
                <Link to="/boards" className="board-page__back">
                    ← К списку досок
                </Link>
            </div>
        );
    }

    if (!board) return null;

    const canManageColumns = canEditBoard(user, board);

    const totalCards = board.columns.reduce(
        (sum, c) => sum + c.cards.length,
        0
    );

    return (
        <div className="board-page">
            <header className="board-header">
                <div className="board-header__left">
                    <Link to="/boards" className="board-header__back" title="К доскам">
                        ←
                    </Link>
                    <div>
                        <div className="board-header__title">{board.name}</div>
                        {board.description && (
                            <div className="board-header__desc">{board.description}</div>
                        )}
                    </div>
                </div>

                <div className="board-header__right">
                    <span className="board-header__stat">
                        {board.columns.length} кол. · {totalCards} карт.
                    </span>

                    <span
                        className={`board-header__ws board-header__ws--${wsStatus}`}
                        title={
                            wsStatus === 'open'
                                ? 'Подключено к real-time'
                                : wsStatus === 'connecting'
                                    ? 'Подключение…'
                                    : wsStatus === 'auth_failed'
                                        ? 'Ошибка авторизации WebSocket. Войдите заново.'
                                        : 'Нет соединения — попытки восстановить'
                        }
                    >
                        <span className="board-header__ws-dot" />
                        {wsStatus === 'open'
                            ? 'Live'
                            : wsStatus === 'connecting'
                                ? '…'
                                : wsStatus === 'auth_failed'
                                    ? 'Auth'
                                    : 'Offline'}
                    </span>

                    {canManageColumns && (
                        <button className="btn" onClick={openCreateColumn}>
                            + Колонка
                        </button>
                    )}
                    <span className="board-header__user">{user?.username}</span>
                </div>
            </header>

            <main className="board-main">
                {board.columns.length === 0 ? (
                    <div className="board-empty">
                        <p className="muted">В этой доске пока нет колонок.</p>
                        {canManageColumns && (
                            <button className="btn" onClick={openCreateColumn}>
                                Создать первую колонку
                            </button>
                        )}
                    </div>
                ) : (
                        <KanbanDndContext
                            board={board}
                            user={user}
                            canManageColumns={canManageColumns}
                            onAddCard={openCreateCard}
                            onEditCard={openEditCard}
                            onDeleteCard={setDeletingCard}
                            onEditColumn={openEditColumn}
                            onDeleteColumn={setDeletingColumn}
                            onMoveCard={moveCard}
                            onReorderColumns={reorderColumns}
                        />
                )}
            </main>

            {columnForm.open && (
                <ColumnFormModal
                    initial={columnForm.editing}
                    onSubmit={handleColumnSubmit}
                    onClose={closeColumnForm}
                    submitting={columnSubmitting}
                    error={columnError}
                />
            )}

            {cardForm.open && board.columns.length > 0 && (
                <CardFormModal
                    initial={cardForm.editing}
                    columns={board.columns}
                    defaultColumnId={cardForm.defaultColumnId}
                    onSubmit={handleCardSubmit}
                    onClose={closeCardForm}
                    submitting={cardSubmitting}
                    error={cardError}
                />
            )}

            {deletingColumn && (
                <ConfirmDialog
                    title="Удалить колонку?"
                    message={`Колонка «${deletingColumn.name}» и все её карточки (${deletingColumn.cards.length} шт.) будут удалены. Действие необратимо.`}
                    onConfirm={handleDeleteColumn}
                    onCancel={() =>
                        !deleteColumnSubmitting && setDeletingColumn(null)
                    }
                    submitting={deleteColumnSubmitting}
                />
            )}

            {deletingCard && (
                <ConfirmDialog
                    title="Удалить карточку?"
                    message={`Карточка «${deletingCard.title}» будет удалена.`}
                    onConfirm={handleDeleteCard}
                    onCancel={() => !deleteCardSubmitting && setDeletingCard(null)}
                    submitting={deleteCardSubmitting}
                />
            )}
        </div>
    );
}