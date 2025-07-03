import { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';

import { usePdfjs } from '../utils/pdfjs';

function Rotate() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const pdfjs = usePdfjs();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setPageThumbnails([]); // Reset thumbnails on new file selection
  };

  useEffect(() => {
    const generateAllPageThumbnails = async () => {
      if (file && pdfjs) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const pdfData = new Uint8Array(reader.result as ArrayBuffer);
            const loadingTask = pdfjs.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            const thumbnails: string[] = [];

            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement('canvas');
              const canvasContext = canvas.getContext('2d');
              if (canvasContext) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = {
                  canvasContext,
                  viewport,
                };
                await page.render(renderContext).promise;
                thumbnails.push(canvas.toDataURL());
              }
            }
            setPageThumbnails(thumbnails);
          } catch (err) {
            console.error("Error generating thumbnails:", err);
            setPageThumbnails([]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setPageThumbnails([]);
      }
    };
    generateAllPageThumbnails();
  }, [file, pdfjs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to rotate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // PDF rotation functionality using pdf-lib has been removed.
      // If you need this functionality, a new WASM-based library or server-side implementation will be required.
      // const pdfDoc = await PDFDocument.load(arrayBuffer);
      // const pages = pdfDoc.getPages();

      // pages.forEach(page => {
      //   page.setRotation(degrees(parseInt(rotation, 10)));
      // });

      // const pdfBytes = await pdfDoc.save();
      const pdfBytes = arrayBuffer; // Placeholder: returns original file
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rotated.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during rotation.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Rotate PDF</h2>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {file ? (
          <div style={{ textAlign: 'center' }}>
            <p>{file.name}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {pageThumbnails.map((url, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  {url ? (
                    <img src={url} alt={`Page ${index + 1} Thumbnail`} style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                      No Preview
                    </div>
                  )}
                  <p style={{ fontSize: '0.8em', marginTop: '5px' }}>Page {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>Drag 'n' drop a PDF file here, or click to select a file</p>
        )}
      </div>
      <Form onSubmit={handleSubmit} className="mt-3">
        <Form.Group className="mb-3">
          <Form.Label>Rotation Angle</Form.Label>
          <Form.Select value={rotation} onChange={(e) => setRotation(e.target.value)} disabled={!file}>
            <option value="90">90 degrees</option>
            <option value="180">180 degrees</option>
            <option value="270">270 degrees</option>
          </Form.Select>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading || !file}>
          {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Rotate'}
        </Button>
      </Form>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default Rotate;