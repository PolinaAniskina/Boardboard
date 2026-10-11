import { useState } from 'react';
import Modal from './Modal';

export default function BoardFormModal({
    initial,
    onSubmit,
    onClose,
    submitting,
    error,
}) {
    const isEdit = Boolean(initial);
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setLocalError('Введите название доски');
            return;
        }
        setLocalError('');
        onSubmit({ name: name.trim(), description: description.trim() });
    };

    return (
        <Modal
            title={isEdit ? 'Редактировать доску' : 'Новая доска'}
            onClose={onClose}
        >
            <form className="form" onSubmit={handleSubmit}>
                <label className="form__label">
                    Название
                    <input
                        className="form__input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        autoFocus
                    />
                </label>

                <label className="form__label">
                    Описание
                    <textarea
                        className="form__textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </label>

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