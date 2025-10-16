import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { ProjectList } from './components/ProjectList';
import { ProjectView } from './components/ProjectView';
import { Project } from './lib/supabase';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div>
      <header style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Access Metadata Explorer</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>{user.email}</span>
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#4CAF50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        {selectedProject ? (
          <ProjectView
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <ProjectList onSelectProject={setSelectedProject} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
