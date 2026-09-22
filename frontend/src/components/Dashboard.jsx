import React, { useState } from 'react';
import './KanbanCard.css';

export const Dashboard = ({
    handleLogout,
    loading,
    boards,
    name, setName,
    description, setDescription,
    activeBoardId, setActiveBoardId,
    newColName, setNewColName,
    addColumn,
    deleteBoard,
    deleteColumn,
    activeColumnId, setActiveColumnId,
    newCardName, setNewCardName,
    newCardDesc, setNewCardDesc,
    addCard,
    toggleCard,
    deleteCard,
    newBoardName,
    setNewBoardName,
    isCreatingBoard,
    setIsCreatingBoard,
    handleCreate
}) => {
    // null = форма закрыта, board.id = открыта для конкретной доски
    const [isCreatingColumn, setIsCreatingColumn] = useState(null);

    return (
        <div className="kanban-board-container" style={{ padding: '20px' }}>

            {/* --- ШАПКА: Заголовок и Выход --- */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <h1 style={{
                    color: '#ffffff',
                    fontSize: '32px',
                    fontWeight: '700',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    marginBottom: '20px',
                    letterSpacing: '1px'
                }}>
                    Мои доски
                </h1>
                {/* Кнопка создания новой доски */}
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => setIsCreatingBoard(true)}
                        style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#388e3c')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#4caf50')}
                    >
                        + Новая доска
                    </button>
                    
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#b02b2b',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#8c1e1e'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#b02b2b'}
                >
                    Выход
                </button>

                {/* Форма создания доски (скрыта по умолчанию) */}
                {isCreatingBoard && (
                    <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#252525',
                        border: '1px solid #444',
                        borderRadius: '8px'
                    }}>
                        <input
                            type="text"
                            placeholder="Название доски..."
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#111',
                                border: '1px solid #444',
                                color: '#fff',
                                borderRadius: '4px',
                                marginBottom: '12px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    handleCreate(newBoardName);
                                    setIsCreatingBoard(false);
                                    setNewBoardName('');
                                }}
                                disabled={!newBoardName.trim()}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: !newBoardName.trim() ? 'not-allowed' : 'pointer',
                                    opacity: !newBoardName.trim() ? 0.5 : 1
                                }}
                            >
                                Создать
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreatingBoard(false);
                                    setNewBoardName('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#333',
                                    color: '#aaa',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* --- РЕНДЕР ДОСОК --- */}
            {boards.map((board) => (
                <div key={board.id} style={{ marginBottom: '40px' }}>

                    {/* Название доски */}
                    <h2 style={{
                        color: '#ccc',
                        fontSize: '20px',
                        fontWeight: '600',
                        margin: '0 0 15px 0',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #333'
                    }}>
                        {board.name}
                    </h2>
                    <button
                        onClick={() => deleteBoard(board.id)}
                        title="Удалить доску"
                        style={{
                            backgroundColor: '#b02b2b',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Удалить
                    </button>

                    {/* Область колонок конкретной доски */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        paddingBottom: '20px'
                    }}>

                        {/* --- Колонки --- */}
                        {board.columns.map((col) => (
                            <div key={col.id} className="column-wrapper" style={{ flexShrink: 0, width: '300px' }}>

                                {/* Шапка колонки */}
                                <div className="column-header" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid #333'
                                }}>
                                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '18px' }}>
                                        {col.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setActiveColumnId(col.id)}
                                            style={{
                                                backgroundColor: '#333',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                                        >
                                            + Задача
                                        </button>
                                        <button
                                            onClick={() => deleteColumn(board.id, col.id)}
                                            style={{
                                                backgroundColor: '#b02b2b',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                {/* Карточки */}
                                {col.cards.map((card) => {
                                    const isDone = card.status === 'done';
                                    return (
                                        <div
                                            key={card.id}
                                            className={isDone ? 'card-wrapper done' : 'card-wrapper'}
                                            style={{ marginBottom: '10px' }}
                                        >
                                            <div className="card-content">
                                                <h3 className="card-title" style={{ margin: 0, color: '#fff' }}>{card.title}</h3>
                                                {card.description && (
                                                    <p className="card-description" style={{ margin: '5px 0 0', color: '#aaa' }}>{card.description}</p>
                                                )}
                                            </div>
                                            <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <button
                                                    className={isDone ? 'btn-toggle done-state' : 'btn-toggle active-state'}
                                                    onClick={() => toggleCard(col.id, card.id)}
                                                    aria-label={isDone ? "Вернуть в работу" : "Отметить как выполненное"}
                                                    style={{ padding: '4px 8px', cursor: 'pointer' }}
                                                >
                                                    {isDone ? '↻' : '✓'}
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteCard(col.id, card.id)}
                                                    style={{ padding: '4px 8px', cursor: 'pointer', color: '#ff5252' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Форма добавления задачи */}
                                {activeColumnId === col.id && (
                                    <div style={{ marginTop: '15px', width: '100%' }}>
                                        <input
                                            type="text"
                                            id="new-task-title"
                                            name="new-task-title"
                                            placeholder="Новая задача..."
                                            value={newCardName}
                                            onChange={(e) => setNewCardName(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#111',
                                                border: '1px solid #444',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                marginBottom: '8px',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <button
                                            onClick={() => addCard(col.id)}
                                            disabled={!newCardName.trim()}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: '#b02b2b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: !newCardName.trim() ? 'not-allowed' : 'pointer',
                                                opacity: !newCardName.trim() ? 0.6 : 1
                                            }}
                                        >
                                            + Добавить
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* --- Форма создания колонки (для текущей доски) --- */}
                        {isCreatingColumn === board.id && (
                            <div className="column-wrapper" style={{
                                flexShrink: 0,
                                width: '300px',
                                border: '2px dashed #444',
                                padding: '10px',
                                backgroundColor: '#252525'
                            }}>
                                <input
                                    type="text"
                                    id="new-column-name"
                                    name="new-column-name"
                                    placeholder="Название колонки..."
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: '#111',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        marginBottom: '8px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => {
                                            addColumn(board.id);
                                            setIsCreatingColumn(null);
                                            setNewColName('');
                                        }}
                                        disabled={!newColName.trim()}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: !newColName.trim() ? 'not-allowed' : 'pointer',
                                            opacity: !newColName.trim() ? 0.5 : 1
                                        }}
                                    >
                                        Создать
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreatingColumn(null);
                                            setNewColName('');
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            background: '#333',
                                            color: '#aaa',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- Кнопка "Добавить колонку" --- */}
                        {isCreatingColumn !== board.id && (
                            <button
                                onClick={() => setIsCreatingColumn(board.id)}
                                style={{
                                    flexShrink: 0,
                                    width: '300px',
                                    backgroundColor: '#2d2d2d',
                                    color: '#aaa',
                                    border: '1px solid #444',
                                    padding: '40px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#fff';
                                    e.target.style.borderColor = '#666';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#aaa';
                                    e.target.style.borderColor = '#444';
                                }}
                            >
                                <span style={{ fontSize: '24px', marginBottom: '8px' }}>+</span>
                                <span>Новая колонка</span>
                            </button>
                        )}

                    </div>
                </div>
            ))}

        </div>
    );
};
