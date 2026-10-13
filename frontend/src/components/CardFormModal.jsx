import { useState } from 'react';
import Modal from './Modal';

export default function CardFormModal({
    initial,
    columns,
    members = [],
    availableLabels = [],
    defaultColumnId,
    onSubmit,
    onClose,
    submitting,
    error,
}) {
    const isEdit = Boolean(initial);

    const [title, setTitle] = useState(initial?.title ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [assigneeId, setAssigneeId] = useState(
        initial?.assignee_id != null ? String(initial.assignee_id) : ''
    );
    const [columnId, setColumnId] = useState(
        initial?.column_id ?? defaultColumnId ?? columns[0]?.id ?? null
    );
    const [labelIds, setLabelIds] = useState(
        () => (initial?.labels || []).map((l) => l.id)
    );
    const [localError, setLocalError] = useState('');

    // вместо toggleLabel
    const selectLabel = (id) => {
        // клик по уже выбранной — снимает метку
        setLabelIds((prev) => (prev.includes(id) ? [] : [id]));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setLocalError('Введите название карточки');
            return;
        }
        if (!isEdit && !columnId) {
            setLocalError('Выберите колонку');
            return;
        }
        setLocalError('');

        // Базовый payload (без assignee_id — добавим при необходимости)
        const payload = {
            title: title.trim(),
            description: description.trim(),
        };

        // assignee_id: включаем только если непустой.
        // Снять исполнителя без правки бэкенда нельзя
        // (в роутере update_card стоит `if data.assignee_id is not None`).
        if (assigneeId !== '') {
            payload.assignee_id = Number(assigneeId);
        }

        if (isEdit) {
            onSubmit(payload, labelIds);
            return;
        }

        // Создание: добавляем column_id и position
        const targetColumn = columns.find((c) => c.id === Number(columnId));
        const position =
            (targetColumn?.cards?.length ?? 0) > 0
                ? Math.max(...targetColumn.cards.map((c) => c.position ?? 0)) + 1
                : 0;

        onSubmit(
            {
                ...payload,
                column_id: Number(columnId),
                position,
            },
            labelIds
        );
    };

    return (
        <Modal
            title={isEdit ? 'Редактировать карточку' : 'Новая карточка'}
            onClose={onClose}
        >
            <form className="form" onSubmit={handleSubmit}>
                <label className="form__label">
                    Название
                    <input
                        className="form__input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        autoFocus
                    />
                </label>

                <label className="form__label">
                    Описание
                    <textarea
                        className="form__textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </label>

                {!isEdit && (
                    <label className="form__label">
                        Колонка
                        <select
                            className="form__input"
                            value={columnId ?? ''}
                            onChange={(e) => setColumnId(e.target.value)}
                        >
                            {columns.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {members.length > 0 && (
                    <label className="form__label">
                        Исполнитель
                        <select
                            className="form__input"
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                        >
                            <option value="">— не назначен —</option>
                            {members.map((m) => (
                                <option key={m.user_id} value={m.user_id}>
                                    {m.username}
                                    {m.is_owner ? ' (владелец)' : ''}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {availableLabels.length > 0 && (
                    <div className="form__label">
                        Метки
                        <div className="labels-picker">
                            {availableLabels.map((l) => {
                                const active = labelIds.includes(l.id);
                                return (
                                    <button
                                        type="button"
                                        key={l.id}
                                        className={`labels-picker__item ${active ? 'labels-picker__item--active' : ''
                                            }`}
                                        style={{ '--label-color': l.color }}
                                        onClick={() => selectLabel(l.id)}
                                    >
                                        <span
                                            className="labels-picker__dot"
                                            style={{ background: l.color }}
                                        />
                                        {l.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(localError || error) && (
                    <div className="form__error">{localError || error}</div>
                )}

                <div className="form__actions">
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Отмена
                    </button>
                    <button type="submit" className="btn" disabled={submitting}>
                        {submitting ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}