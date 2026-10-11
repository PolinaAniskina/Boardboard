import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanColumn from '../KanbanColumn';

export default function SortableColumn({
    column,
    board,
    user,
    canManageColumns,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onEditColumn,
    onDeleteColumn,
    children,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `column-${column.id}`,
        data: { type: 'column', column },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <KanbanColumn
                column={column}
                board={board}
                user={user}
                canManageColumns={canManageColumns}
                onAddCard={onAddCard}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
                onEditColumn={onEditColumn}
                onDeleteColumn={onDeleteColumn}
                dragHandleProps={{ ...attributes, ...listeners }}
            >
                {children}
            </KanbanColumn>
        </div>
    );
}