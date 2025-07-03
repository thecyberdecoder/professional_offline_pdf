import { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { usePdfjs } from '../utils/pdfjs';

function Unlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pdfjs = usePdfjs();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setPassword(''); // Clear password on new file selection
    setIsPasswordProtected(null); // Reset status
    setStatusMessage(null); // Reset status message
  };

  useEffect(() => {
    const checkPdfProtection = async () => {
      if (file && pdfjs) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const pdfData = new Uint8Array(reader.result as ArrayBuffer);
            const loadingTask = pdfjs.getDocument({ data: pdfData });
            await loadingTask.promise; // Attempt to load without password
            setIsPasswordProtected(false);
            setStatusMessage('This PDF is not password protected.');
          } catch (err: any) {
            if (err.name === 'PasswordException') {
              setIsPasswordProtected(true);
              setStatusMessage('This PDF is password protected. Please enter the password.');
            } else {
              setIsPasswordProtected(false);
              setStatusMessage('Could not read PDF. It might be corrupted or an unsupported format.');
              console.error("Error loading PDF:", err);
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setIsPasswordProtected(null);
        setStatusMessage(null);
      }
    };
    checkPdfProtection();
  }, [file, pdfjs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleClear = () => {
    setFile(null);
    setPassword('');
    setError(null);
    setLoading(false);
    setIsPasswordProtected(null);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !password) {
      setError('Please select a PDF file and enter a password.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/unlock', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to unlock PDF.');
      }

      const unlockedPdfBlob = await response.blob();
      const url = window.URL.createObjectURL(unlockedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'unlocked.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      handleClear(); // Clear form after successful unlock
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during unlocking.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unlock-container">
      <h2>Unlock PDF</h2>

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
        {statusMessage && (
          <Alert variant={isPasswordProtected ? "warning" : "info"} className="mt-3">
            {statusMessage}
          </Alert>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!file || loading || !isPasswordProtected} // Only enable if file is selected and is password protected
          />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading || !file || (isPasswordProtected && !password)}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Unlock PDF'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Unlocking PDF...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default Unlock;