import React from 'react';

export const BoardCard = ({
    board,
    col,
    activeColumnId,
    setActiveColumnId,
    newCardName,
    setNewCardName,
    newCardDesc,
    setNewCardDesc,
    addCard,
    toggleCard,
    deleteCard,
    deleteColumn
}) => {
    const isActive = activeColumnId === col.id;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Форма добавления карточки (показывается только если колонка активна) */}
            {isActive && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                        type="text"
                        placeholder="Новая карточка..."
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        style={{ flex: 1, padding: '0.4rem' }}
                    />
                    <button
                        onClick={addCard}
                        disabled={!newCardName.trim()}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Добавить
                    </button>
                </div>
            )}

            {/* Список карточек */}
            <div style={{ flex: 1 }}>
                {(col.cards || []).length === 0 ? (
                    <p style={{ color: '#adb5bd', fontStyle: 'italic', fontSize: '0.9rem' }}>Карточек нет</p>
                ) : (
                        col.cards.map((card) => (
                            <div
                                key={card.id}
                                style={{
                                    background: card.status === 'done' ? '#f8f9fa' : 'white', // Меняем фон
                                    border: `1px solid \${card.status === 'done' ? '#dee2e6' : '#ced4da'}`,
                                    padding: '0.6rem',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: card.status === 'done' ? 0.8 : 1, // Легкая прозрачность для выполненных
                                    transition: 'opacity 0.3s ease' // Плавное изменение
                                }}
                            >
                                <div style={{ maxWidth: '200px' }}>
                                    <strong
                                        style={{
                                            // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ: проверяем status, а не completed
                                            textDecoration: card.status === 'done' ? 'line-through' : 'none',
                                            color: card.status === 'done' ? '#6c757d' : 'inherit',
                                            fontSize: card.status === 'done' ? '0.95em' : '1em' // Чуть мельче шрифт
                                        }}
                                    >
                                        {card.title}
                                    </strong>
                                    {card.description && (
                                        <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                            {card.description}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleCard(col.id, card.id)}
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            // Меняем цвет кнопки в зависимости от статуса
                                            background: card.status === 'done' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {card.status === 'done' ? '↻' : '✓'}
                                    </button>
                                    <button
                                        onClick={() => deleteCard(col.id, card.id)}
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))
                )}
            </div>

            {/* Кнопка удаления колонки */}
            <button
                onClick={() => deleteColumn(board.id, col.id)}
                style={{
                    marginTop: '0.75rem',
                    padding: '0.4rem',
                    background: 'transparent',
                    color: '#dc3545',
                    border: '1px solid #dc3545',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                Удалить колонку
            </button>
        </div>
    );
};
