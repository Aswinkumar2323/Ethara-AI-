import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // for assigning tasks

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Forms
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [projectRes, usersRes] = await Promise.all([
        axios.get(`/projects/${id}`),
        axios.get('/users')
      ]);
      setProject(projectRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/tasks`, newTask);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assigneeId: '', dueDate: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`/projects/${id}/members`, { email: newMemberEmail, role: 'MEMBER' });
      setShowMemberModal(false);
      setNewMemberEmail('');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await axios.delete(`/projects/${id}/members/${userId}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading project details...</div>;
  if (!project) return <div>Project not found</div>;

  const isAdmin = project.isCurrentUserAdmin;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.name}</h1>
            <p className="text-subtle">{project.description}</p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                <Users size={18} /> Add Member
              </button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                <Plus size={18} /> Add Task
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Task Board */}
        <div style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tasks Board</h2>
          
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {['TODO', 'IN_PROGRESS', 'DONE'].map(status => {
              const columnTasks = project.tasks.filter(t => t.status === status);
              return (
                <div key={status} className="glass-panel" style={{ flex: '1', minWidth: '280px', padding: '1rem', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{status.replace('_', ' ')}</h3>
                    <div className="badge" style={{ background: 'var(--bg-tertiary)' }}>{columnTasks.length}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {columnTasks.map(task => (
                      <div key={task.id} className="glass-card" style={{ padding: '1rem', cursor: 'pointer' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{task.title}</h4>
                        {task.description && <p className="text-subtle" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{task.description}</p>}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {task.assignee ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                {task.assignee.name}
                              </div>
                            ) : 'Unassigned'}
                          </div>
                          
                          <select 
                            value={task.status} 
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}
                            style={{ 
                              padding: '0.25rem 0.5rem', outline: 'none', cursor: 'pointer',
                              appearance: 'none', WebkitAppearance: 'none', paddingRight: '1rem'
                            }}
                          >
                            <option value="TODO" style={{ background: 'var(--bg-secondary)', color: '#9ca3af' }}>TODO</option>
                            <option value="IN_PROGRESS" style={{ background: 'var(--bg-secondary)', color: '#fbbf24' }}>IN PROGRESS</option>
                            <option value="DONE" style={{ background: 'var(--bg-secondary)', color: '#34d399' }}>DONE</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} className="text-subtle" /> Team Members
          </h2>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {project.members.map(member => (
                <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-emerald)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{member.user.name} {member.userId === user.id && '(You)'}</div>
                      <div className="text-subtle" style={{ fontSize: '0.75rem' }}>{member.user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {member.role === 'ADMIN' ? (
                      <span className="badge badge-admin">Admin</span>
                    ) : (
                      <span className="badge badge-todo">Member</span>
                    )}
                    {isAdmin && member.userId !== user.id && (
                      <button className="btn-icon" style={{ color: 'var(--accent-rose)' }} onClick={() => handleRemoveMember(member.userId)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input type="text" required className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea className="input-field" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              </div>
              <div className="input-group">
                <label className="input-label">Assign To</label>
                <select className="input-field" value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date (Optional)</label>
                <input type="date" className="input-field" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add Team Member</h2>
            {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <label className="input-label">User Email Address</label>
                <input type="email" required className="input-field" placeholder="member@example.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
