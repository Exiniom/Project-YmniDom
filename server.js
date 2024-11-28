const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3341;

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./bd/mydb.db', (err) => {
    if (err) {
        console.error("Ошибка при подключении к базе данных:", err.message);
        return;
    }
    console.log("Подключение к базе данных успешно.");

    // Создание таблицы пользователей, если она ещё не существует
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `, (err) => {
        if (err) {
            console.error("Ошибка при создании таблицы пользователей:", err.message);
        } else {
            console.log('Table "users" создана или уже существует.');
        }
    });

    // Создание таблицы устройств, если она ещё не существует
    db.run(`
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            room TEXT NOT NULL,
            state INTEGER NOT NULL DEFAULT 0
        );
    `, (err) => {
        if (err) {
            console.error("Ошибка при создании таблицы устройств:", err.message);
        } else {
            console.log('Table "devices" создана или уже существует.');
        }
    });

    // Начальная запись устройств (при необходимости)
    const initialDevices = [
        { name: 'Телевизор', room: 'Зал' },
        { name: 'Колонки', room: 'Зал' },
        { name: 'Свет', room: 'Зал' },
        { name: 'Телевизор', room: 'Игровая комната' },
        { name: 'Консоль', room: 'Игровая комната' },
        { name: 'Компьютер', room: 'Игровая комната' },
        { name: 'Свет', room: 'Игровая комната' },
        { name: 'Чайник', room: 'Кухня' },
        { name: 'Микроволновка', room: 'Кухня' },
        { name: 'Телевизор', room: 'Кухня' },
        { name: 'Свет', room: 'Кухня' }
    ];

    initialDevices.forEach(device => {
        db.run(`INSERT OR IGNORE INTO devices (name, room) VALUES (?, ?)`, [device.name, device.room], err => {
            if (err) {
                console.error(`Ошибка добавления устройства ${device.name}:`, err.message);
            }
        });
    });
});

// Маршрут для получения всех пользователей
app.get('/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
        }
        res.json(rows);
    });
});

// Маршрут для регистрации пользователей
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Пожалуйста, заполните все поля.' });
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error("Ошибка базы данных при проверке пользователя:", err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (row) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
            if (err) {
                console.error("Ошибка базы данных при добавлении пользователя:", err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            res.json({ message: 'Регистрация успешна', userId: this.lastID });
        });
    });
});

// Маршрут для входа пользователей
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Необходимо указать имя пользователя и пароль.");
    }

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            console.error("Ошибка при выполнении запроса к базе данных:", err);
            return res.status(500).send("Ошибка сервера при выполнении запроса.");
        }
        if (row) {
            return res.send("Авторизация успешна, приветствуем, " + username);
        } else {
            return res.status(401).send("Неверное имя пользователя или пароль.");
        }
    });
});

// Маршрут для получения всех устройств
app.get('/devices', (req, res) => {
    db.all("SELECT * FROM devices", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера при получении устройств' });
        }
        res.json(rows);
    });
});

// Маршрут для обновления состояния устройства
app.put('/devices/:id', (req, res) => {
    const { id } = req.params;
    const { state } = req.body;

    db.run("UPDATE devices SET state = ? WHERE id = ?", [state, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка обновления состояния устройства' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Устройство не найдено' });
        }
        res.json({ message: 'Состояние устройства обновлено.', id });
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

// Обработка закрытия соединения с базой данных
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
        process.exit(0);
    });
});

// Обработка ошибок 404 для всех остальных запросов
app.use((req, res) => {
    res.status(404).json({ error: 'Страница не найдена' });
});

// Обработка ошибок сервера
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Произошла внутренняя ошибка сервера' });
});
