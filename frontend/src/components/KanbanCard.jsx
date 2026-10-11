import { canDeleteCard } from '../utils/permissions';

const STATUS_LABELS = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
};

export default function KanbanCard({
    card,
    board,
    user,
    onEdit,
    onDelete,
}) {
    const deletable = canDeleteCard(user, board);
    const statusLabel = STATUS_LABELS[card.status] || card.status;

    return (
        <div className="kanban-card" onClick={() => onEdit(card)}>
            <div className="kanban-card__title">{card.title}</div>

            {card.description && (
                <div className="kanban-card__desc">{card.description}</div>
            )}

            <div className="kanban-card__footer">
                <span className={`kanban-card__status kanban-card__status--${card.status}`}>
                    {statusLabel}
                </span>

                <div className="kanban-card__actions">
                    {deletable && (
                        <button
                            type="button"
                            className="kanban-card__icon-btn kanban-card__icon-btn--danger"
                            title="Удалить"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(card);
                            }}
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}