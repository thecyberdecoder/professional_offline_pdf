import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';

function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressionQuality, setCompressionQuality] = useState<number>(50); // 0-100 for slider
  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setOriginalSize(acceptedFiles[0].size);
    setCompressedSize(null); // Reset compressed size on new file selection
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to compress.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    let qualityToSend: 'low' | 'medium' | 'high';
    if (compressionQuality <= 33) {
      qualityToSend = 'low';
    } else if (compressionQuality <= 66) {
      qualityToSend = 'medium';
    } else {
      qualityToSend = 'high';
    }

    formData.append('quality', qualityToSend);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/compress', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to compress PDF.');
      }

      const compressedPdfBlob = await response.blob();
      setCompressedSize(compressedPdfBlob.size);

      const url = window.URL.createObjectURL(compressedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during compression.');
        }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setLoading(false);
    setOriginalSize(null);
    setCompressedSize(null);
    setCompressionQuality(50); // Reset to default
  };

  return (
    <div className="compress-container">
      <h2>Compress PDF</h2>

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
        <Form.Group controlId="compressionQuality" className="mb-3">
          <Form.Label>Compression Quality: {compressionQuality}%</Form.Label>
          <Form.Range
            min={0}
            max={100}
            step={1}
            value={compressionQuality}
            onChange={(e) => setCompressionQuality(parseInt(e.target.value))}
          />
          {file && originalSize !== null && (
            <Alert variant="info" className="mt-3">
              <p>Original Size: <strong>{(originalSize / 1024 / 1024).toFixed(2)} MB</strong></p>
              <p>Estimated Compressed Size: <strong>{((originalSize * (1 - (compressionQuality / 100) * 0.7)) / 1024 / 1024).toFixed(2)} MB</strong> (approx)</p>
            </Alert>
          )}
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading || !file}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Compress'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Compressing PDF...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {originalSize !== null && compressedSize !== null && (
        <Alert variant="success" className="mt-3 compression-results">
          <h4>Compression Results</h4>
          <p>Original Size: <strong>{(originalSize / 1024 / 1024).toFixed(2)} MB</strong></p>
          <p>Compressed Size: <strong>{(compressedSize / 1024 / 1024).toFixed(2)} MB</strong></p>
          <p>Reduction: <strong>{(((originalSize - compressedSize) / originalSize) * 100).toFixed(2)}%</strong></p>
          <Button variant="success" onClick={handleClear} className="mt-2">Compress Another</Button>
        </Alert>
      )}
    </div>
  );
}

export default Compress;
