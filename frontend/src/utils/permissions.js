// Владелец доски или глобальный админ
export function canEditBoard(user, board) {
    if (!user || !board) return false;
    if (user.roles?.includes('admin')) return true;
    return board.owner_id === user.id;
}

export function canDeleteBoard(user, board) {
    return canEditBoard(user, board);
}

// Карточки: создавать/редактировать/перемещать — owner, участник или админ.
// Удалять — только owner или админ.
export function canEditCard(user, board) {
    if (!user || !board) return false;
    if (user.roles?.includes('admin')) return true;
    if (board.owner_id === user.id) return true;
    // Если доска в списке пользователя — он либо owner, либо member.
    return true;
}

export function canDeleteCard(user, board) {
    if (!user || !board) return false;
    if (user.roles?.includes('admin')) return true;
    return board.owner_id === user.id;
}