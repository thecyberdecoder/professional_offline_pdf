import { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { FaTimesCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

import { usePdfjs } from '../utils/pdfjs';

interface MergeFile {
  id: string;
  originalFile: File;
}

function Merge() {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const pdfjs = usePdfjs();

  const onDrop = (acceptedFiles: File[]) => {
    const newMergeFiles: MergeFile[] = acceptedFiles.map((file) => ({
      id: `file-${file.name}-${file.size}-${Date.now()}`,
      originalFile: file,
    }));
    setFiles((prevFiles) => [...prevFiles, ...newMergeFiles]);
    setThumbnailUrls([]); // Clear previous thumbnails to regenerate for new set of files
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: true });

  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
    setError(null);
    setLoading(false);
    setThumbnailUrls([]);
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prevFiles) => {
      const newFiles = Array.from(prevFiles);
      if (direction === 'up' && index > 0) {
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      } else if (direction === 'down' && index < newFiles.length - 1) {
        [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      }
      return newFiles;
    });
  };

  useEffect(() => {
    const generateThumbnails = async () => {
      if (files.length > 0 && pdfjs) {
        const urls: string[] = [];
        for (const file of files) {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const pdfData = new Uint8Array(reader.result as ArrayBuffer);
              const loadingTask = pdfjs.getDocument({ data: pdfData });
              const pdf = await loadingTask.promise;
              const page = await pdf.getPage(1);
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
                urls.push(canvas.toDataURL());
                if (urls.length === files.length) {
                  setThumbnailUrls(urls);
                }
              }
            } catch (err) {
              console.error("Error generating thumbnail:", err);
              urls.push(''); // Push empty string for failed thumbnail
              if (urls.length === files.length) {
                setThumbnailUrls(urls);
              }
            }
          };
          reader.readAsArrayBuffer(file.originalFile);
        }
      } else {
        setThumbnailUrls([]);
      }
    };
    generateThumbnails();
  }, [files, pdfjs]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length < 2) {
      setError('Please select at least two PDF files to merge.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file.originalFile);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/merge', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to merge PDFs.');
      }

      const mergedPdfBlob = await response.blob();
      const url = window.URL.createObjectURL(mergedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      handleClearAll(); // Clear form after successful merge
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during merging.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merge-container">
      <h2>Merge PDFs</h2>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${files.length > 0 ? 'file-selected' : ''}`}
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <div className="file-info">
            <p>Drag & Drop more files, or click to add</p>
            <Button variant="secondary" onClick={handleClearAll} className="mt-2">Clear All Files</Button>
          </div>
        ) : (
          <p>Drag 'n' drop PDF files here, or click to select files (select at least two)</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="files-preview-container mt-3">
          <h4>Files to Merge (Use buttons to reorder):</h4>
          <div className="files-preview">
            {files.map((file, index) => (
              <div key={file.id} className="file-item">
                {thumbnailUrls[index] ? (
                  <img src={thumbnailUrls[index]} alt="PDF Thumbnail" />
                ) : (
                  <div className="no-preview">No Preview</div>
                )}
                <p>{file.originalFile.name}</p>
                <div className="file-item-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMoveFile(index, 'up')}
                    disabled={index === 0}
                  >
                    <FaArrowUp />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMoveFile(index, 'down')}
                    disabled={index === files.length - 1}
                  >
                    <FaArrowDown />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="remove-file-btn"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <FaTimesCircle />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Form onSubmit={handleSubmit} className="mt-3">
        <Button variant="primary" type="submit" disabled={loading || files.length < 2}>
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
          ) : (
            'Merge'
          )}
        </Button>
      </Form>

      {loading && (
        <div className="loading-overlay">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Merging PDFs...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default Merge;