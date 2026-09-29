/**
 * TaskFlow – Simple Task Manager
 * Vanilla JavaScript Frontend
 * Communicates with Express.js Backend via Fetch API
 */

// Application State
let tasks = [];
let activeFilter = 'all';

// DOM Elements
const taskListContainer = document.getElementById('task-list-container');
const addTaskForm = document.getElementById('add-task-form');
const taskInput = document.getElementById('task-input');
const formError = document.getElementById('form-error');
const refreshBtn = document.getElementById('refresh-btn');
const serverBadge = document.getElementById('server-status-badge');
const serverStatusText = document.getElementById('server-status-text');

// Stat Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statPercent = document.getElementById('stat-percent');
const progressBarFill = document.getElementById('progress-bar-fill');

// Tab Count Elements
const countAll = document.getElementById('count-all');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const filterTabs = document.querySelectorAll('.filter-tab');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Base API URL: Defaults to relative /api when served via Express,
// or falls back to http://localhost:3000/api if opened via file:// or Live Server
const isFileProtocol = window.location.protocol === 'file:';
const API_URL = isFileProtocol ? 'http://localhost:3000/api' : '/api';

/**
 * Initialize Application
 */
async function initApp() {
  if (isFileProtocol) {
    showFileProtocolNotice();
  }
  setupEventListeners();
  await checkServerHealth();
  await fetchTasks();
  // Periodic health check every 30 seconds
  setInterval(checkServerHealth, 30000);
}

/**
 * Show helpful guidance banner if opened via file:// instead of http://localhost:3000
 */
function showFileProtocolNotice() {
  const banner = document.createElement('div');
  banner.className = 'file-protocol-banner';
  banner.innerHTML = `
    <div class="banner-content">
      <span class="banner-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </span>
      <div class="banner-text">
        <strong>Direct File Opened:</strong> You are viewing via <code>file://</code> protocol.
        Browser security policies block API calls from local files.
        Please open <a href="http://localhost:3000">http://localhost:3000</a> in your browser.
      </div>
    </div>
    <a href="http://localhost:3000" class="btn btn-sm btn-banner">Go to localhost:3000</a>
  `;
  document.querySelector('.app-container').prepend(banner);
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Add task form submission
  addTaskForm.addEventListener('submit', handleAddTask);

  // Clear form error on typing
  taskInput.addEventListener('input', () => {
    hideFormError();
  });

  // Filter tabs
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Refresh button
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.style.transform = 'rotate(180deg)';
    await fetchTasks();
    await checkServerHealth();
    setTimeout(() => {
      refreshBtn.style.transform = 'none';
    }, 300);
  });
}

/**
 * Check Server Health (/api/health)
 */
async function checkServerHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      serverBadge.className = 'server-badge online';
      serverStatusText.textContent = 'Server Online';
    } else {
      throw new Error('Health check responded with non-200');
    }
  } catch (error) {
    console.warn('Server health check failed:', error);
    serverBadge.className = 'server-badge offline';
    serverStatusText.textContent = 'Server Offline';
  }
}

/**
 * Fetch all tasks (GET /api/tasks)
 */
async function fetchTasks() {
  try {
    const res = await fetch(`${API_URL}/tasks`);
    if (!res.ok) {
      throw new Error(`Failed to fetch tasks: ${res.statusText}`);
    }
    const data = await res.json();
    tasks = Array.isArray(data) ? data : [];
    updateStats();
    renderTasks();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    renderErrorState('Could not connect to TaskFlow server. Please check your backend.');
    showToast('Failed to load tasks', 'error');
  }
}

/**
 * Handle Add Task Form Submission (POST /api/tasks)
 */
async function handleAddTask(e) {
  e.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    showFormError('Please enter a task description');
    taskInput.classList.add('input-shake');
    setTimeout(() => taskInput.classList.remove('input-shake'), 400);
    taskInput.focus();
    return;
  }

  const submitBtn = document.getElementById('add-task-btn');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create task');
    }

    const newTask = await res.json();
    tasks.unshift(newTask);
    taskInput.value = '';
    hideFormError();
    updateStats();
    renderTasks();
    showToast('Task added successfully!', 'success');
  } catch (error) {
    console.error('Error adding task:', error);
    showFormError(error.message);
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    taskInput.focus();
  }
}

/**
 * Toggle Task Completion (PUT /api/tasks/:id)
 */
async function toggleTask(id, currentStatus) {
  const newStatus = !currentStatus;

  // Optimistic UI update
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = newStatus;
    updateStats();
    renderTasks();
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: newStatus })
    });

    if (!res.ok) {
      throw new Error('Failed to update task');
    }

    const updatedTask = await res.json();
    // Update authoritative task in state
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
    updateStats();
    renderTasks();
    showToast(newStatus ? 'Task marked as completed' : 'Task marked as pending', 'success');
  } catch (error) {
    console.error('Error toggling task:', error);
    // Revert optimistic update
    if (task) {
      task.completed = currentStatus;
      updateStats();
      renderTasks();
    }
    showToast('Failed to update task status', 'error');
  }
}

/**
 * Delete Task (DELETE /api/tasks/:id)
 */
async function deleteTask(id) {
  // Store deleted task in case of revert
  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) return;
  const removedTask = tasks[taskIndex];

  // Optimistic removal
  tasks.splice(taskIndex, 1);
  updateStats();
  renderTasks();

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete task');
    }

    showToast('Task deleted', 'success');
  } catch (error) {
    console.error('Error deleting task:', error);
    // Revert optimistic delete
    tasks.splice(taskIndex, 0, removedTask);
    updateStats();
    renderTasks();
    showToast('Failed to delete task', 'error');
  }
}

/**
 * Render Tasks in the UI
 */
function renderTasks() {
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'pending') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  if (filteredTasks.length === 0) {
    let emptyMessage = 'No tasks yet. Create your first task above!';
    if (activeFilter === 'pending') emptyMessage = 'All caught up! No pending tasks.';
    if (activeFilter === 'completed') emptyMessage = 'No completed tasks yet. Finish a task to see it here!';

    taskListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <polyline points="9 11 12 14 22 4"></polyline>
          </svg>
        </div>
        <h3 class="empty-state-title">No Tasks Found</h3>
        <p class="empty-state-subtitle">${emptyMessage}</p>
      </div>
    `;
    return;
  }

  taskListContainer.innerHTML = filteredTasks
    .map((task) => {
      const isCompleted = Boolean(task.completed);
      const safeTitle = escapeHTML(task.title);
      const formattedDate = formatDate(task.createdAt);

      return `
        <article class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-main">
            <button
              type="button"
              class="custom-checkbox ${isCompleted ? 'checked' : ''}"
              onclick="toggleTask('${task.id}', ${isCompleted})"
              aria-label="${isCompleted ? 'Mark as pending' : 'Mark as completed'}"
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <polyline points="1.5 5 4.5 8 10.5 1.5"></polyline>
              </svg>
            </button>
            <div class="task-details">
              <span class="task-title">${safeTitle}</span>
              <div class="task-meta">
                <span class="status-pill ${isCompleted ? 'completed' : 'pending'}">
                  ${isCompleted ? 'Completed' : 'Pending'}
                </span>
                <span class="task-date">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px; opacity:0.75;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>${formattedDate}
                </span>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button
              type="button"
              class="btn-delete"
              onclick="deleteTask('${task.id}')"
              title="Delete task"
              aria-label="Delete task"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

/**
 * Update Dashboard Statistics & Tab Counters
 */
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stat cards
  statTotal.textContent = total;
  statPending.textContent = pending;
  statCompleted.textContent = completed;
  statPercent.textContent = `${percent}%`;
  progressBarFill.style.width = `${percent}%`;

  // Filter tab counts
  countAll.textContent = total;
  countPending.textContent = pending;
  countCompleted.textContent = completed;
}

/**
 * Display an error message below the input
 */
function showFormError(msg) {
  formError.textContent = msg;
  formError.style.display = 'block';
}

function hideFormError() {
  formError.textContent = '';
  formError.style.display = 'none';
}

/**
 * Render Error State in the Task List Container
 */
function renderErrorState(msg) {
  taskListContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 class="empty-state-title">Connection Error</h3>
      <p class="empty-state-subtitle">${msg}</p>
    </div>
  `;
}

/**
 * Toast Notifications with Real SVG Icons
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

/**
 * Utility: HTML Escaping to prevent XSS
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Utility: Format timestamp nicely
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
