import { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableColumn from './SortableColumn';
import KanbanCard from '../KanbanCard';

function findColumnByCardId(columns, cardId) {
    return columns.find((c) => c.cards.some((card) => `card-${card.id}` === cardId));
}

export default function KanbanDndContext({
    board,
    user,
    canManageColumns,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onEditColumn,
    onDeleteColumn,
    onMoveCard,
    onReorderColumns,
}) {
    const columns = board.columns;

    const [activeId, setActiveId] = useState(null);
    const [activeType, setActiveType] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columnIds = useMemo(
        () => columns.map((c) => `column-${c.id}`),
        [columns]
    );

    const activeCard = useMemo(() => {
        if (activeType !== 'card' || !activeId) return null;
        const col = findColumnByCardId(columns, activeId);
        return col?.cards.find((c) => `card-${c.id}` === activeId) ?? null;
    }, [activeId, activeType, columns]);

    const activeColumn = useMemo(() => {
        if (activeType !== 'column' || !activeId) return null;
        return columns.find((c) => `column-${c.id}` === activeId) ?? null;
    }, [activeId, activeType, columns]);

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type ?? null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setActiveType(null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        const type = active.data.current?.type;
        setActiveId(null);
        setActiveType(null);

        if (!over) return;

        // --- Перетаскивание КОЛОНКИ ---
        if (type === 'column') {
            if (active.id === over.id) return;

            let overColumnId = null;
            const overIdStr = String(over.id);
            if (overIdStr.startsWith('column-cards-')) {
                overColumnId = Number(overIdStr.replace('column-cards-', ''));
            } else if (overIdStr.startsWith('column-')) {
                overColumnId = Number(overIdStr.replace('column-', ''));
            } else {
                return;
            }

            const oldIndex = columns.findIndex((c) => `column-${c.id}` === active.id);
            const newIndex = columns.findIndex((c) => c.id === overColumnId);
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

            const reordered = arrayMove(columns, oldIndex, newIndex);
            onReorderColumns(reordered.map((c) => c.id));
            return;
        }

        // --- Перетаскивание КАРТОЧКИ ---
        if (type === 'card') {
            const fromColumn = findColumnByCardId(columns, active.id);
            if (!fromColumn) return;

            const fromIndex = fromColumn.cards.findIndex(
                (c) => `card-${c.id}` === active.id
            );

            let toColumnId;
            let toIndex;

            if (String(over.id).startsWith('card-')) {
                const overCard = columns
                    .flatMap((c) => c.cards)
                    .find((c) => `card-${c.id}` === over.id);
                if (!overCard) return;

                toColumnId = fromColumn.id === overCard.column_id
                    ? fromColumn.id
                    : overCard.column_id;

                const toColumn = columns.find((c) => c.id === toColumnId);
                const overIndexInToColumn = toColumn.cards.findIndex(
                    (c) => `card-${c.id}` === over.id
                );
                toIndex = overIndexInToColumn;
            } else if (String(over.id).startsWith('column-cards-')) {
                toColumnId = Number(String(over.id).replace('column-cards-', ''));
                const toColumn = columns.find((c) => c.id === toColumnId);
                toIndex = toColumn ? toColumn.cards.length : 0;
            } else {
                return;
            }

            // Если ничего не изменилось — не двигаем
            if (fromColumn.id === toColumnId && fromIndex === toIndex) {
                return;
            }

            const cardId = Number(String(active.id).replace('card-', ''));
            onMoveCard({ cardId, fromColumnId: fromColumn.id, toColumnId, toIndex });
        }
    };

    const renderCardOverlay = () => {
        if (activeType !== 'card' || !activeCard) return null;
        return (
            <div className="kanban-drag-overlay">
                <KanbanCard
                    card={activeCard}
                    board={board}
                    user={user}
                    onEdit={() => { }}
                    onDelete={() => { }}
                />
            </div>
        );
    };

    const renderColumnOverlay = () => {
        if (activeType !== 'column' || !activeColumn) return null;
        return (
            <div className="kanban-drag-overlay kanban-drag-overlay--column">
                <div className="kanban-column-overlay">
                    <div className="kanban-column-overlay__name">
                        {activeColumn.name}
                    </div>
                    <div className="kanban-column-overlay__count">
                        {activeColumn.cards.length} карт.
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                <div className="kanban">
                    {columns.map((column) => (
                        <SortableColumn
                            key={column.id}
                            column={column}
                            board={board}
                            user={user}
                            canManageColumns={canManageColumns}
                            onAddCard={onAddCard}
                            onEditCard={onEditCard}
                            onDeleteCard={onDeleteCard}
                            onEditColumn={onEditColumn}
                            onDeleteColumn={onDeleteColumn}
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
                {renderCardOverlay()}
                {renderColumnOverlay()}
            </DragOverlay>
        </DndContext>
    );
}