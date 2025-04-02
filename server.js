const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Настройка сессий
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    }
}));

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
}

// Хранение пользователей (в реальном приложении используйте БД)
const users = [];

// Middleware для парсинга JSON и urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static('public'));

// Регистрация
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Требуются имя пользователя и пароль' });
    }
    
    if (users.some(u => u.username === username)) {
        return res.status(400).json({ error: 'Имя пользователя уже существует' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (error) {
        res.status(500).json({ error: 'Регистрация не удалась' });
    }
});

// Вход
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { username };
            return res.json({ message: 'Успешный вход' });
        } else {
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

// Новый маршрут для получения данных пользователя
app.get('/api/user', requireAuth, (req, res) => {
    res.json({ username: req.session.user.username });
});

// Выход
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Профиль (защищенный)
app.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Кэширование данных
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// Генерация данных
function generateData() {
    return {
        timestamp: Date.now(),
        data: crypto.randomBytes(16).toString('hex')
    };
}

// Получение данных с кэшированием
app.get('/data', (req, res) => {
    const cacheFile = path.join(cacheDir, 'data.json');
    
    try {
        // Проверяем наличие и актуальность кэша
        if (fs.existsSync(cacheFile)) {
            const cachedData = JSON.parse(fs.readFileSync(cacheFile));
            const age = Date.now() - cachedData.timestamp;
            
            if (age < 60000) { // 1 минута
                return res.json(cachedData);
            }
        }
        
        // Генерируем новые данные и сохраняем в кэш
        const newData = generateData();
        fs.writeFileSync(cacheFile, JSON.stringify(newData));
        res.json(newData);
    } catch (error) {
        console.error('Cache error:', error);
        res.status(500).json({ error: 'Failed to get data' });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});