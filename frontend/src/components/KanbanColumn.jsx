import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './dnd/SortableCard';

export default function KanbanColumn({
    column,
    board,
    user,
    canManageColumns,
    dragHandleProps,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onEditColumn,
    onDeleteColumn,
}) {
    const cardIds = column.cards.map((c) => `card-${c.id}`);

    const { setNodeRef: setCardsRef, isOver } = useDroppable({
        id: `column-cards-${column.id}`,
        data: { type: 'column-cards', columnId: column.id },
    });

    return (
        <div className="kanban-column">
            <div
                className="kanban-column__header kanban-column__header--draggable"
                {...dragHandleProps}
            >
                <div className="kanban-column__name" title={column.name}>
                    {column.name}
                </div>

                <div className="kanban-column__right">
                    <div className="kanban-column__count">{column.cards.length}</div>

                    {canManageColumns && (
                        <div
                            className="kanban-column__menu"
                            // Не даём drag при клике на иконки
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="kanban-column__icon-btn"
                                title="Переименовать"
                                onClick={() => onEditColumn(column)}
                            >
                                ✎
                            </button>
                            <button
                                type="button"
                                className="kanban-column__icon-btn kanban-column__icon-btn--danger"
                                title="Удалить"
                                onClick={() => onDeleteColumn(column)}
                            >
                                🗑
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={setCardsRef}
                className={`kanban-column__cards ${isOver ? 'kanban-column__cards--over' : ''
                    }`}
            >
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {column.cards.map((card) => (
                        <SortableCard
                            key={card.id}
                            card={card}
                            board={board}
                            user={user}
                            onEdit={onEditCard}
                            onDelete={onDeleteCard}
                        />
                    ))}
                </SortableContext>

                {column.cards.length === 0 && (
                    <div className="kanban-column__empty">Нет карточек</div>
                )}
            </div>

            <button
                type="button"
                className="kanban-column__add"
                onClick={() => onAddCard(column)}
            >
                + Добавить карточку
            </button>
        </div>
    );
}