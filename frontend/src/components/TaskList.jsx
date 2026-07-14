import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api';
import './TaskList.css';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll();
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar las tareas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    try {
      if (editingId) {
        await tasksAPI.update(editingId, {
          title,
          description,
        });
        setEditingId(null);
      } else {
        await tasksAPI.create(title, description);
      }
      setTitle('');
      setDescription('');
      setError('');
      fetchTasks();
    } catch (err) {
      setError('Error al guardar la tarea');
      console.error(err);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await tasksAPI.update(task.id, { completed: !task.completed });
      fetchTasks();
    } catch (err) {
      setError('Error al actualizar la tarea');
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      try {
        await tasksAPI.delete(id);
        fetchTasks();
      } catch (err) {
        setError('Error al eliminar la tarea');
        console.error(err);
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
  };

  return (
    <div className="tasklist-container">
      <div className="tasklist-header">
        <h2>Mis Tareas</h2>
        <div className="stats">
          <span>Total: {stats.total}</span>
          <span>Completadas: {stats.completed}</span>
          <span>Pendientes: {stats.pending}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="task-form">
        <h3>{editingId ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
        <form onSubmit={handleAddTask}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Título de la tarea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-title"
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-description"
              rows="2"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({stats.total})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes ({stats.pending})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completadas ({stats.completed})
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando tareas...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === 'all'
              ? 'No hay tareas aún. ¡Crea una nueva!'
              : `No hay tareas ${
                  filter === 'pending' ? 'pendientes' : 'completadas'
                }`}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-checkbox">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task)}
                  id={`task-${task.id}`}
                />
                <label htmlFor={`task-${task.id}`}></label>
              </div>

              <div className="task-content">
                <h4>{task.title}</h4>
                {task.description && <p>{task.description}</p>}
                <small>
                  Creada: {new Date(task.created_at).toLocaleDateString()}
                </small>
              </div>

              <div className="task-actions">
                <button
                  className="btn btn-edit"
                  onClick={() => handleEditTask(task)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;
