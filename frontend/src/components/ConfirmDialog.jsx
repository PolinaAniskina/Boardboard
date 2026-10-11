import Modal from './Modal';

export default function ConfirmDialog({
    title = 'Подтверждение',
    message,
    confirmText = 'Удалить',
    cancelText = 'Отмена',
    onConfirm,
    onCancel,
    submitting,
    danger = true,
}) {
    return (
        <Modal title={title} onClose={onCancel}>
            <div className="confirm">
                <p className="confirm__message">{message}</p>
                <div className="form__actions">
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn ${danger ? 'btn--danger' : ''}`}
                        onClick={onConfirm}
                        disabled={submitting}
                    >
                        {submitting ? 'Удаляем…' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}