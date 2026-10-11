import { useState } from 'react';
import Modal from './Modal';

export default function CardFormModal({
    initial,
    columns,
    defaultColumnId,
    onSubmit,
    onClose,
    submitting,
    error,
}) {
    const isEdit = Boolean(initial);

    const [title, setTitle] = useState(initial?.title ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [columnId, setColumnId] = useState(
        initial?.column_id ?? defaultColumnId ?? columns[0]?.id ?? null
    );
    const [localError, setLocalError] = useState('');

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

        if (isEdit) {
            onSubmit({
                title: title.trim(),
                description: description.trim(),
            });
        } else {
            const targetColumn = columns.find((c) => c.id === Number(columnId));
            const position =
                (targetColumn?.cards?.length ?? 0) > 0
                    ? Math.max(...targetColumn.cards.map((c) => c.position ?? 0)) + 1
                    : 0;
            onSubmit({
                title: title.trim(),
                description: description.trim(),
                column_id: Number(columnId),
                position,
            });
        }
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