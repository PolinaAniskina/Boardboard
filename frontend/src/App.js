import { useState, useEffect } from 'react';
import axios from 'axios';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';

const API_BASE = `http://localhost:8000/api`;

function App() {
  const [boards, setBoards] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Теперь токен мы сначала пытаемся взять из localStorage
  const [token, setToken] = useState(localStorage.getItem('app_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('app_token'));

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activeBoardId, setActiveBoardId] = useState(null);
  const [newColName, setNewColName] = useState('');
  const [activeColumnId, setActiveColumnId] = useState(null);

  const [newCardName, setNewCardName] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  const [newBoardName, setNewBoardName] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);




  // Функция загрузки списка
  const fetchBoards = async (tok) => {
    const useToken = tok || token;
    if (!useToken) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/boards`, {
        headers: { Authorization: 'Bearer ' + useToken }
      });
      const data = res.data || [];
      const boardsWithCols = data.map(b => ({
        ...b,
        columns: (b.columns || []).map(c => ({
          ...c,
          cards: (c.cards || []).map(card => ({
            ...card,
            board_id: b.id // ✅ ДОБАВЛЕНО: теперь у карточки есть ID доски!
          }))
        }))
      }));
      setBoards(boardsWithCols);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить доски. Проверьте соединение или токен.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Если токен уже был в localStorage (пользователь уже входил), сразу грузим доски
    if (token) {
      fetchBoards();
    }
  }, [token]);

  const handleRegister = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`http://127.0.0.1:8000/api/auth/register`, {
        username,
        email,
        password
      });
      // После успешной регистрации — сразу логиним
      await doLogin(username, password);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Не удалось зарегистрироваться';
      setError(typeof msg === 'string' ? msg : 'Пользователь уже существует');
    } finally {
      setLoading(false);
    }
  };

  // Функция входа (сохранение токена)
  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    await doLogin(username, password);
    setLoading(false);
  };

  const doLogin = async (username, password) => {
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/auth/login`, {
        username,
        password
      });
      const newToken = res.data.access_token;
      localStorage.setItem('app_token', newToken);
      setToken(newToken);
      setIsAuthenticated(true);
      fetchBoards(newToken); // Передаём новый токен явно
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Неверный логин или пароль';
      setError(typeof msg === 'string' ? msg : 'Ошибка входа');
      setIsAuthenticated(false);
    }
  };

  // Функция создания доски
  const handleCreate = async (name) => {
    if (!name) return;

    setLoading(true);
    setError(null);
    try {
      const payload = { name };
      if (description.trim()) payload.description = description;

      await axios.post(`http://127.0.0.1:8000/api/boards`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      });

      fetchBoards();
      setName('');
      setDescription('');
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message;
      setError(msg || 'Не удалось создать доску');
    } finally {
      setLoading(false);
    }
  };

  // Функция удаления доски
  const deleteBoard = async (id) => {
    if (!window.confirm('Точно удалить эту доску?')) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/boards/` + id, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      });
      fetchBoards();
      // Если удалили активную доску, закрываем модалку
      if (activeBoardId === id) setActiveBoardId(null);
      alert('Доска удалена!');
    } catch (e) {
      console.error('Ошибка удаления:', e);
      setError('Не удалось удалить доску');
    }
  };

  // Функция выхода (очистка токена)
  const handleLogout = () => {
    localStorage.removeItem('app_token');
    setToken('');
    setIsAuthenticated(false);
    setBoards([]);
    setError(null);
  };

  const addColumn = async (boardId) => {
    if (!newColName.trim() || !boardId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('app_token');
      const res = await axios.post(
        `http://127.0.0.1:8000/api/boards/` + boardId +`/columns`,
        { name: newColName},
        { headers: { Authorization: `Bearer ` + token } }
      );
      setNewColName('');
      //setActiveBoardId(null);
      fetchBoards(); // Перезагружаем список, чтобы подтянулись колонки из БД
    } catch (e) {
      console.error(e);
      // ✅ Всегда извлекаем только строку сообщения
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Не удалось создать колонку';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteColumn = async (boardId, colId) => {
    if (!window.confirm('Удалить колонку?')) return;

    setLoading(true);
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/boards/` + boardId + `/columns/` + colId, // <-- проверь путь
        { headers: { Authorization: `Bearer ` + token } }
      );
      fetchBoards();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Не удалось удалить колонку';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (columnId) => {
    if (!newCardName.trim() || !columnId) return;

    const board = boards.find(b => b.columns.some(c => c.id === columnId));

    if (!board) {
      console.error('Не удалось найти доску для этой колонки');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/boards/` + board.id + `/cards`,
        {
          title: newCardName,
          description: newCardDesc,
          column_id: columnId
        },
        { headers: { Authorization: `Bearer ` + token } }
      );
      setNewCardName('');
      setNewCardDesc('');
      setActiveColumnId(null);
      fetchBoards(); // Перезагружаем, чтобы подтянулись задачи
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Не удалось создать задачу';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = async (columnId, cardId) => {
    // 1. Ищем доску, которой принадлежит эта колонка
    const board = boards.find(b => b.columns.some(c => c.id === columnId));

    if (!board) {
      console.error('Не удалось найти доску для этой колонки');
      return;
    }

    // 2. Ищем саму карточку, чтобы узнать её текущий статус
    const card = board.columns
      .flatMap(c => c.cards)
      .find(t => t.id === cardId);

    if (!card) return;

    // 3. Определяем новый статус
    const newStatus = card.status === 'done' ? 'backlog' : 'done';

    try {
      // ВАЖНО: Используем board.id вместо activeBoardId!
      await axios.put(
        `http://127.0.0.1:8000/api/boards/` + board.id + `/cards/` + cardId,
        {
          status: newStatus
        },
        {
          headers: { Authorization: `Bearer ` + token}
        }
      );

      fetchBoards(); // Обновляем список
    } catch (e) {
      console.error('Ошибка обновления карточки:', e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Не удалось обновить карточку';
      setError(msg);
    }
  };


  const deleteCard = async (columnId, cardId) => {
    if (!window.confirm('Удалить карточку?')) return;

    const board = boards.find(b => b.columns.some(c => c.id === columnId));
    if (!board) {
      console.error('Не удалось найти доску для этой колонки');
      return;
    }
    const token = localStorage.getItem('app_token');
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/boards/` + board.id + `/cards/` + cardId,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      fetchBoards();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Не удалось удалить карточку';
      setError(msg);
    }
  };


  return (
    <div style={{ width: '100%', padding: '20px', boxSizing: 'border-box', backgroundColor: 'black', fontFamily: 'Roboto' }}>

      {error && (
        <div style={{
          color: '#721c24',
          background: '#f8d7da',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <AuthPage
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={loading}
          error={error}
        />
      ) : (
        <Dashboard
          handleLogout={handleLogout}
          handleCreate={handleCreate}
          loading={loading}
          boards={boards}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          activeBoardId={activeBoardId}
          setActiveBoardId={setActiveBoardId}
          newColName={newColName}
          setNewColName={setNewColName}
          addColumn={addColumn}
          deleteBoard={deleteBoard}
          deleteColumn={deleteColumn}

            activeColumnId={activeColumnId}
            setActiveColumnId={setActiveColumnId}
            newCardName={newCardName}
            setNewCardName={setNewCardName}
            newCardDesc={newCardDesc}
            setNewCardDesc={setNewCardDesc}
            addCard={addCard}
            toggleCard={toggleCard}
            deleteCard={deleteCard}

            newBoardName={newBoardName}
            setNewBoardName={setNewBoardName}
            isCreatingBoard={isCreatingBoard}
            setIsCreatingBoard={setIsCreatingBoard}
        />
      )}
    </div>
  );
}

export default App;
