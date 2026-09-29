const crypto = require('crypto');


let tasks = [
  {
    id: '1',
    title: 'Open the curtains for natural sunlight',
    completed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    title: 'Make your bed',
    completed: true,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '3',
    title: 'Prepare clothes for the next day',
    completed: false,
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

/**
 * GET /api/tasks
 * Retrieve all tasks
 */
const getTasks = (req, res) => {
  res.status(200).json(tasks);
};

/**
 * POST /api/tasks
 * Create a new task
 */
const createTask = (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Task title is required and cannot be empty'
    });
  }

  const newTask = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask); // Add new task to the top of the list
  res.status(201).json(newTask);
};

/**
 * PUT /api/tasks/:id
 * Update an existing task (e.g. toggle completion or update title)
 */
const updateTask = (req, res) => {
  const { id } = req.params;
  const { completed, title } = req.body;

  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: `Task with id '${id}' not found`
    });
  }

  const task = tasks[taskIndex];

  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: "'completed' must be a boolean value"
      });
    }
    task.completed = completed;
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Task title must be a non-empty string'
      });
    }
    task.title = title.trim();
  }

  task.updatedAt = new Date().toISOString();
  tasks[taskIndex] = task;

  res.status(200).json(task);
};

/**
 * DELETE /api/tasks/:id
 * Delete a task by ID
 */
const deleteTask = (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: `Task with id '${id}' not found`
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({
    message: 'Task deleted successfully',
    task: deletedTask
  });
};

/**
 * GET /api/health
 * Server health check endpoint
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TaskFlow server is running'
  });
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getHealth
};
