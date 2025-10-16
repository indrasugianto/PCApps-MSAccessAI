import { useState, useEffect } from 'react';
import { supabase, Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    } catch (error: any) {
      alert('Error creating project: ' + error.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading projects...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Projects</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createProject} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="projectName" style={{ display: 'block', marginBottom: '5px' }}>Project Name *</label>
            <input
              id="projectName"
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="projectDescription" style={{ display: 'block', marginBottom: '5px' }}>Description</label>
            <textarea
              id="projectDescription"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Create Project
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {projects.length === 0 ? (
          <p>No projects yet. Create your first project to get started!</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#4CAF50';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <h3 style={{ margin: '0 0 5px 0' }}>{project.name}</h3>
              {project.description && <p style={{ margin: '0 0 10px 0', color: '#666' }}>{project.description}</p>}
              <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

