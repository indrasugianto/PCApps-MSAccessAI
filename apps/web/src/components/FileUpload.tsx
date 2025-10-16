import { useState } from 'react';
import { supabase, Project } from '../lib/supabase';

interface FileUploadProps {
  project: Project;
  onUploadComplete: () => void;
}

export function FileUpload({ project, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const extension = selectedFile.name.toLowerCase().split('.').pop();
      if (extension !== 'accdb' && extension !== 'mdb') {
        setError('Please select a valid Access database file (.accdb or .mdb)');
        setFile(null);
        return;
      }
      setError('');
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // 1. Upload file to Supabase Storage
      const storagePath = `${project.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('access-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Create import job
      const { error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          project_id: project.id,
          access_filename: file.name,
          storage_path: storagePath,
          storage_bucket: 'access-files',
          status: 'pending',
        });

      if (jobError) throw jobError;

      alert('File uploaded successfully! Worker will process it shortly.');
      setFile(null);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px' }}>
      <h3>Upload Access Database</h3>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="file"
          accept=".accdb,.mdb"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginBottom: '10px' }}
        />
        {file && (
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          padding: '10px 20px',
          backgroundColor: file && !uploading ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: file && !uploading ? 'pointer' : 'not-allowed',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}

