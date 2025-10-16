import { useState, useEffect } from 'react';
import { supabase, Project, ImportJob, Query, VbaModule } from '../lib/supabase';
import { FileUpload } from './FileUpload';

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectView({ project, onBack }: ProjectViewProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [modules, setModules] = useState<VbaModule[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queries' | 'modules'>('queries');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [project.id]);

  useEffect(() => {
    if (selectedFile) {
      fetchQueriesAndModules(selectedFile);
    } else {
      fetchAllQueriesAndModules();
    }
  }, [project.id, selectedFile]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQueriesAndModules = async () => {
    try {
      const [queriesResult, modulesResult] = await Promise.all([
        supabase
          .from('queries')
          .select('*')
          .eq('project_id', project.id)
          .order('query_name'),
        supabase
          .from('vba_modules')
          .select('*')
          .eq('project_id', project.id)
          .order('module_name'),
      ]);

      if (queriesResult.error) throw queriesResult.error;
      if (modulesResult.error) throw modulesResult.error;

      setQueries(queriesResult.data || []);
      setModules(modulesResult.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }
  };

  const fetchQueriesAndModules = async (filename: string) => {
    try {
      const [queriesResult, modulesResult] = await Promise.all([
        supabase
          .from('queries')
          .select('*')
          .eq('project_id', project.id)
          .eq('access_filename', filename)
          .order('query_name'),
        supabase
          .from('vba_modules')
          .select('*')
          .eq('project_id', project.id)
          .eq('access_filename', filename)
          .order('module_name'),
      ]);

      if (queriesResult.error) throw queriesResult.error;
      if (modulesResult.error) throw modulesResult.error;

      setQueries(queriesResult.data || []);
      setModules(modulesResult.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }
  };

  const handleUploadComplete = () => {
    fetchJobs();
    // Refresh data every 3 seconds to check for new imports
    const interval = setInterval(() => {
      fetchJobs();
      if (selectedFile) {
        fetchQueriesAndModules(selectedFile);
      } else {
        fetchAllQueriesAndModules();
      }
    }, 3000);

    // Clear interval after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          ← Back to Projects
        </button>
        <h1>{project.name}</h1>
        {project.description && <p style={{ color: '#666' }}>{project.description}</p>}
      </div>

      <FileUpload project={project} onUploadComplete={handleUploadComplete} />

      <div style={{ marginBottom: '20px' }}>
        <h3>Uploaded Files</h3>
        {loading ? (
          <p>Loading...</p>
        ) : jobs.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <div>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                padding: '8px 16px',
                margin: '5px',
                backgroundColor: selectedFile === null ? '#4CAF50' : '#eee',
                color: selectedFile === null ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              All Files
            </button>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedFile(job.access_filename)}
                style={{
                  padding: '8px 16px',
                  margin: '5px',
                  backgroundColor: selectedFile === job.access_filename ? '#4CAF50' : '#eee',
                  color: selectedFile === job.access_filename ? 'white' : 'black',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {job.access_filename} ({job.status}) - {job.query_count} queries, {job.module_count} modules
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: '15px' }}>
          <button
            onClick={() => setActiveTab('queries')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'queries' ? '#4CAF50' : 'transparent',
              color: activeTab === 'queries' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'queries' ? '2px solid #4CAF50' : 'none',
              cursor: 'pointer',
            }}
          >
            Queries ({queries.length})
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'modules' ? '#4CAF50' : 'transparent',
              color: activeTab === 'modules' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'modules' ? '2px solid #4CAF50' : 'none',
              cursor: 'pointer',
            }}
          >
            VBA Modules ({modules.length})
          </button>
        </div>

        {activeTab === 'queries' ? (
          <div>
            {queries.length === 0 ? (
              <p>No queries found.</p>
            ) : (
              queries.map((query) => (
                <details key={query.id} style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    {query.query_name} {selectedFile === null && `(${query.access_filename})`}
                  </summary>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', marginTop: '10px' }}>
                    {query.sql_text}
                  </pre>
                </details>
              ))
            )}
          </div>
        ) : (
          <div>
            {modules.length === 0 ? (
              <p>No VBA modules found.</p>
            ) : (
              modules.map((module) => (
                <details key={module.id} style={{ marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    {module.module_name} ({module.module_type}) {selectedFile === null && `- ${module.access_filename}`}
                  </summary>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', marginTop: '10px' }}>
                    {module.code}
                  </pre>
                </details>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

