import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';

function Lock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleClear = () => {
    setFile(null);
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !password) {
      setError('Please select a PDF file and enter a password to lock it.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/lock', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to lock PDF.');
      }

      const lockedPdfBlob = await response.blob();
      const url = window.URL.createObjectURL(lockedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'locked.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      handleClear(); // Clear form after successful lock
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during locking.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lock-container">
      <h2>Lock PDF</h2>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'file-selected' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="file-info">
            <p>Selected file: <strong>{file.name}</strong></p>
            <Button variant="secondary" onClick={handleClear} className="mt-2">Clear File</Button>
          </div>
        ) : (
          <p>Drag 'n' drop a PDF file here, or click to select a file</p>
        )}
      </div>

      <Form onSubmit={handleSubmit} className="mt-3">
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!file || loading} />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading || !file || !password}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Lock PDF'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Locking PDF...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default Lock;