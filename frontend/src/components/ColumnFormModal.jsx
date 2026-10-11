import { useState } from 'react';
import Modal from './Modal';

export default function ColumnFormModal({
    initial,
    onSubmit,
    onClose,
    submitting,
    error,
}) {
    const isEdit = Boolean(initial);
    const [name, setName] = useState(initial?.name ?? '');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setLocalError('Введите название колонки');
            return;
        }
        setLocalError('');
        onSubmit({ name: name.trim() });
    };

    return (
        <Modal
            title={isEdit ? 'Переименовать колонку' : 'Новая колонка'}
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