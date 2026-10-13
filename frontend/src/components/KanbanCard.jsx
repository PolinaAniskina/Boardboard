import { canDeleteCard } from '../utils/permissions';

function getInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

export default function KanbanCard({ card, board, user, onEdit, onDelete }) {
    const deletable = canDeleteCard(user, board);

    const assignee =
        card.assignee_id != null
            ? (board.members || []).find((m) => m.user_id === card.assignee_id)
            : null;

    const hasLabels = card.labels && card.labels.length > 0;

    return (
        <div className="kanban-card" onClick={() => onEdit(card)}>
            <div className="kanban-card__title">{card.title}</div>

            {card.description && (
                <div className="kanban-card__desc">{card.description}</div>
            )}

            <div className="kanban-card__footer">
                {hasLabels && (
                    <div className="kanban-card__labels">
                        {card.labels.map((l) => (
                            <span
                                key={l.id}
                                className="kanban-card__label"
                                style={{ background: l.color }}
                                title={l.name}
                            >
                                {l.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="kanban-card__right">
                    {assignee && (
                        <span
                            className="kanban-card__assignee"
                            title={`Исполнитель: ${assignee.username}`}
                        >
                            {getInitial(assignee.username)}
                        </span>
                    )}

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
        </div>
    );
}