// API 配置
const API_BASE = "http://localhost:8000";
let currentToken = null;
let currentFilter = "all";
let currentUser = null;

// 页面加载完成
document.addEventListener("DOMContentLoaded", () => {
    const savedToken = localStorage.getItem("todo_token");
    const savedUser = localStorage.getItem("todo_user");

    if (savedToken && savedUser) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
        loadTodos();
    }
});

// 切换登录/注册标签
function switchTab(tab) {
    const loginBtn = document.querySelectorAll(".tab-btn")[0];
    const registerBtn = document.querySelectorAll(".tab-btn")[1];
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (tab === "login") {
        loginBtn.classList.add("active");
        registerBtn.classList.remove("active");
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    } else {
        loginBtn.classList.remove("active");
        registerBtn.classList.add("active");
        loginForm.classList.remove("active");
        registerForm.classList.add("active");
    }
}

// 注册
async function register() {
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    if (!username || !email || !password) {
        alert("请填写所有字段");
        return;
    }

    if (username.length < 3) {
        alert("用户名至少3个字符");
        return;
    }

    if (password.length < 6) {
        alert("密码至少6位");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert("注册成功！请登录");
            switchTab("login");
            document.getElementById("login-username").value = username;
            document.getElementById("login-password").value = "";
        } else {
            const error = await response.json();
            alert("注册失败: " + (error.detail || "请重试"));
        }
    } catch (error) {
        alert("网络错误: " + error.message);
    }
}

// 登录
async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        alert("请填写用户名和密码");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            currentToken = data.access_token;
            currentUser = { username };

            localStorage.setItem("todo_token", currentToken);
            localStorage.setItem("todo_user", JSON.stringify(currentUser));

            showApp();
            loadTodos();
        } else {
            alert("登录失败：用户名或密码错误");
        }
    } catch (error) {
        alert("网络错误: " + error.message);
    }
}

// 退出登录
function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem("todo_token");
    localStorage.removeItem("todo_user");
    showAuth();

    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    document.getElementById("reg-username").value = "";
    document.getElementById("reg-email").value = "";
    document.getElementById("reg-password").value = "";
}

// 显示认证界面
function showAuth() {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
}

// 显示主应用界面
function showApp() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
    document.getElementById("username-display").textContent = currentUser.username;
}

// 创建待办事项
async function createTodo() {
    const title = document.getElementById("todo-title").value;
    const description = document.getElementById("todo-desc").value;
    const priority = parseInt(document.getElementById("todo-priority").value);

    if (!title) {
        alert("请输入任务标题");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/todos/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${currentToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, description, priority })
        });

        if (response.ok) {
            document.getElementById("todo-title").value = "";
            document.getElementById("todo-desc").value = "";
            loadTodos();
        } else {
            const error = await response.json();
            alert("创建失败: " + (error.detail || "请重试"));
        }
    } catch (error) {
        alert("网络错误: " + error.message);
    }
}

// 加载待办事项
async function loadTodos() {
    try {
        let url = `${API_BASE}/todos/`;

        if (currentFilter === "active") {
            url += "?completed=false";
        } else if (currentFilter === "completed") {
            url += "?completed=true";
        }

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${currentToken}` }
        });

        if (response.ok) {
            const todos = await response.json();
            renderTodos(todos);
        }
    } catch (error) {
        console.error("加载失败:", error);
    }
}

// 渲染待办列表
function renderTodos(todos) {
    const container = document.getElementById("todo-list");

    if (todos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📭
                <p>暂无任务，创建一个吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-header">
                <input type="checkbox"
                       class="todo-checkbox"
                       ${todo.completed ? 'checked' : ''}
                       onchange="window.toggleComplete(${todo.id}, this.checked)">
                <span class="todo-title">${escapeHtml(todo.title)}</span>
                <span class="priority-badge priority-${todo.priority}">
                    ${todo.priority === 1 ? '🟢 低' : todo.priority === 2 ? '🟡 中' : '🔴 高'}
                </span>
            </div>
            ${todo.description ? `<div class="todo-description">📝 ${escapeHtml(todo.description)}</div>` : ''}
            <div class="todo-footer">
                <span>📅 ${formatDate(todo.created_at)}</span>
                <button class="delete-btn" onclick="window.deleteTodo(${todo.id})">删除</button>
            </div>
        </div>
    `).join('');
}

// 切换完成状态
async function toggleComplete(id, completed) {
    const endpoint = completed ? "complete" : "incomplete";

    try {
        const response = await fetch(`${API_BASE}/todos/${id}/${endpoint}`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${currentToken}` }
        });

        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error("更新失败:", error);
    }
}

// 删除待办
async function deleteTodo(id) {
    if (!confirm("确定要删除这个任务吗？")) return;

    try {
        const response = await fetch(`${API_BASE}/todos/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${currentToken}` }
        });

        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error("删除失败:", error);
    }
}

// 筛选待办
function filterTodos(filter) {
    currentFilter = filter;

    const btns = document.querySelectorAll(".filter-btn");
    btns.forEach(btn => btn.classList.remove("active"));

    if (filter === "all") btns[0].classList.add("active");
    else if (filter === "active") btns[1].classList.add("active");
    else if (filter === "completed") btns[2].classList.add("active");

    loadTodos();
}

// 辅助函数
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 3600 * 1000 && date.getDate() === now.getDate()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 确保所有函数都在全局作用域
window.switchTab = switchTab;
window.login = login;
window.register = register;
window.logout = logout;
window.createTodo = createTodo;
window.filterTodos = filterTodos;
window.toggleComplete = toggleComplete;
window.deleteTodo = deleteTodo;