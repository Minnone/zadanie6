document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации на странице профиля
    if (window.location.pathname === '/profile') {
        checkAuth();
    }
    
    // Инициализация темы
    initTheme();
    
    // Обработчики событий
    setupEventListeners();
});

function checkAuth() {
    fetch('/profile', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = '/';
        } else {
            // Устанавливаем имя пользователя
            fetch('/profile', {
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    document.getElementById('username').textContent = data.username;
                }
            });
            
            // Загружаем данные
            loadData();
        }
    })
    .catch(error => {
        console.error('Auth check failed:', error);
        window.location.href = '/';
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function setupEventListeners() {
    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            fetch('/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    window.location.href = '/';
                }
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
        });
    }
    
    // Обновление данных
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
}

async function loadData() {
    try {
        const dataContainer = document.getElementById('dataContainer');
        dataContainer.innerHTML = '<p>Загрузка данных...</p>';
        
        let response = await fetch('/data', { credentials: 'include' });
        if (response.ok) {
            let data = await response.json();
            displayData(data);
        } else {
            dataContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('dataContainer').innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}

function displayData(data) {
    let container = document.getElementById('dataContainer');
    
    // Создаем копию объекта, исключая ненужные поля
    const {data: _, timestamp: __, ...cleanData} = data;
    
    container.innerHTML = `
        <h3>Данные (источник: ${data.source || 'неизвестно'})</h3>
        ${Object.keys(cleanData).length > 0 
            ? `<pre>${JSON.stringify(cleanData, null, 2)}</pre>` 
            : '<p>Нет дополнительных данных</p>'}
        <p>Последнее обновление: ${new Date(data.timestamp).toLocaleString()}</p>
    `;
}

// Добавьте этот код в setupEventListeners()

// Регистрация
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                alert('Регистрация успешна!');
                window.location.reload();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
        }
    });
}

// Вход
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                window.location.href = '/profile';
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
        }
    });
}