import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';

function AddWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState('50');
  const [color, setColor] = useState('#ff0000');
  const [opacity, setOpacity] = useState(0.5); // New state for opacity
  const [watermarkPosition, setWatermarkPosition] = useState<'diagonal' | 'center'>('diagonal'); // New state for position
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleClear = () => {
    setFile(null);
    setText('CONFIDENTIAL');
    setFontSize('50');
    setColor('#ff0000');
    setOpacity(0.5); // Reset opacity
    setWatermarkPosition('diagonal'); // Reset position
    setError(null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !text || !fontSize || !color) {
      setError('Please select a PDF file and fill in all watermark details.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', text);
    formData.append('fontSize', fontSize);
    formData.append('color', color);
    formData.append('opacity', opacity.toString()); // Send opacity as string
    formData.append('position', watermarkPosition); // Send position

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/add-watermark', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add watermark.');
      }

      const watermarkedPdfBlob = await response.blob();
      const url = window.URL.createObjectURL(watermarkedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'watermarked.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      handleClear(); // Clear form after successful watermark
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during adding watermark.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-watermark-container">
      <h2>Add Watermark</h2>

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
          <Form.Label>Watermark Text</Form.Label>
          <Form.Control type="text" value={text} onChange={(e) => setText(e.target.value)} disabled={!file || loading} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Font Size</Form.Label>
          <Form.Control type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} disabled={!file || loading} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Color</Form.Label>
          <Form.Control type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={!file || loading} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Opacity: {(opacity * 100).toFixed(0)}%</Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            disabled={!file || loading}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Watermark Position</Form.Label>
          <div>
            <Form.Check
              inline
              type="radio"
              label="Diagonal"
              name="watermarkPosition"
              value="diagonal"
              checked={watermarkPosition === 'diagonal'}
              onChange={() => setWatermarkPosition('diagonal')}
              disabled={!file || loading}
            />
            <Form.Check
              inline
              type="radio"
              label="Center"
              name="watermarkPosition"
              value="center"
              checked={watermarkPosition === 'center'}
              onChange={() => setWatermarkPosition('center')}
              disabled={!file || loading}
            />
          </div>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading || !file || !text || !fontSize || !color}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Add Watermark'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Adding Watermark...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default AddWatermark;