import { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { usePdfjs } from '../utils/pdfjs';

function Split() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const pdfjs = usePdfjs();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setPageThumbnails([]);
    setSelectedPages([]);
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

  const handleClear = () => {
    setFile(null);
    setError(null);
    setLoading(false);
    setPageThumbnails([]);
    setSelectedPages([]);
  };

  const handlePageClick = (pageNumber: number) => {
    setSelectedPages((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageNumber)) {
        return prevSelectedPages.filter((page) => page !== pageNumber);
      } else {
        return [...prevSelectedPages, pageNumber].sort((a, b) => a - b);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || selectedPages.length === 0) {
      setError('Please select a PDF file and at least one page to split.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', JSON.stringify(selectedPages)); // Send selected pages as JSON string

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/split', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to split PDF.');
      }

      const splitPdfBlob = await response.blob();
      const url = window.URL.createObjectURL(splitPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'split.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      handleClear(); // Clear form after successful split
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during splitting.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      <h2>Split PDF</h2>

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

      {file && pageThumbnails.length > 0 && (
        <div className="page-thumbnails-container mt-3">
          <h4>Select Pages to Split:</h4>
          <div className="page-thumbnails">
            {pageThumbnails.map((url, index) => (
              <div
                key={index}
                className={`page-thumbnail ${selectedPages.includes(index + 1) ? 'selected' : ''}`}
                onClick={() => handlePageClick(index + 1)}
              >
                {url ? (
                  <img src={url} alt={`Page ${index + 1} Thumbnail`} />
                ) : (
                  <div className="no-preview">No Preview</div>
                )}
                <p>Page {index + 1}</p>
              </div>
            ))}
          </div>
          <p className="mt-2">Selected Pages: {selectedPages.length > 0 ? selectedPages.join(', ') : 'None'}</p>
        </div>
      )}

      <Form onSubmit={handleSubmit} className="mt-3">
        <Button variant="primary" type="submit" disabled={loading || !file || selectedPages.length === 0}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Split'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Splitting PDF...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default Split;