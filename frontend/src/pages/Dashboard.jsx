import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, Clock, AlertCircle, LayoutList, Briefcase, CheckSquare } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        axios.get('/dashboard'),
        axios.get('/projects')
      ]);
      setStats(statsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>Dashboard Overview</h1>
          <p className="text-subtle">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ borderTop: '2px solid var(--accent-indigo)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-indigo)' }}>
              <LayoutList size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stats?.todoCount || 0}</div>
          <div className="text-subtle" style={{ fontSize: '0.875rem' }}>Tasks To Do</div>
        </div>

        <div className="glass-card" style={{ borderTop: '2px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-amber)' }}>
              <Clock size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stats?.inProgressCount || 0}</div>
          <div className="text-subtle" style={{ fontSize: '0.875rem' }}>In Progress</div>
        </div>

        <div className="glass-card" style={{ borderTop: '2px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stats?.doneCount || 0}</div>
          <div className="text-subtle" style={{ fontSize: '0.875rem' }}>Tasks Done</div>
        </div>

        <div className="glass-card" style={{ borderTop: '2px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)' }}>
              <AlertCircle size={24} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{stats?.overdueCount || 0}</div>
          <div className="text-subtle" style={{ fontSize: '0.875rem' }}>Overdue Tasks</div>
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Projects List */}
        <div style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} className="text-subtle" /> Your Projects
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projects.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No projects yet. Create one to get started!
              </div>
            ) : (
              projects.map(project => (
                <Link to={`/projects/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{project.name}</h3>
                      <p className="text-subtle" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{project.description || 'No description'}</p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                          <LayoutList size={14} /> {project._count.tasks} Tasks
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="badge badge-admin">
                        {project.members.find(m => m.role === 'ADMIN') ? 'Has Admin' : ''} View Project
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={20} className="text-subtle" /> Recent Tasks
          </h2>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            {stats?.recentTasks?.length === 0 ? (
              <p className="text-subtle" style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.875rem' }}>No recent tasks.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats?.recentTasks?.map(task => (
                  <div key={task.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{task.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span className="text-subtle">{task.project.name}</span>
                      <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input type="text" required className="input-field" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea className="input-field" rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
