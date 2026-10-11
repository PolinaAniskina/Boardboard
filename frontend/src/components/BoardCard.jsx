import { useNavigate } from 'react-router-dom';
import { canEditBoard, canDeleteBoard } from '../utils/permissions';
import { useAuth } from '../hooks/useAuth';

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return '';
    }
}

export default function BoardCard({ board, onEdit, onDelete }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const editable = canEditBoard(user, board);
    const deletable = canDeleteBoard(user, board);

    const openBoard = () => navigate(`/boards/${board.id}`);

    return (
        <div className="board-card" onClick={openBoard}>
            <div className="board-card__head">
                <div className="board-card__name" title={board.name}>
                    {board.name}
                </div>
                <div className="board-card__menu">
                    {editable && (
                        <button
                            type="button"
                            className="board-card__icon-btn"
                            title="Редактировать"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(board);
                            }}
                        >
                            ✎
                        </button>
                    )}
                    {deletable && (
                        <button
                            type="button"
                            className="board-card__icon-btn board-card__icon-btn--danger"
                            title="Удалить"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(board);
                            }}
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>

            {board.description && (
                <div className="board-card__desc">{board.description}</div>
            )}

            <div className="board-card__meta">
                <span>#{board.id}</span>
                {board.created_at && <span>{formatDate(board.created_at)}</span>}
                {board.columns?.length > 0 && (
                    <span>{board.columns.length} кол.</span>
                )}
            </div>
        </div>
    );
}