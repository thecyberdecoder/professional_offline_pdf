import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';

function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setThumbnailUrl('data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJmaWxlLXdvcmQiIGNsYXNzPSJzdmctYmluYSBmYS1maWxlLXdvcmQgZmEtdy0xMiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0zNjkgMTYwSjI0MGMtMTMuMjU1IDAtMjQgMTAuNzQ1LTI0IDI0djEyOWMwIDUuNTIzIDQuNDc3IDEwIDEwIDEwczEwLTQuNDc3IDEwLTEwVjE4NGgxMjljMTMuMjU1IDAgMjQtMTAuNzQ1IDI0LTI0cy0xMC43NDUtMjQtMjQtMjR6TTI4OCAwSDU0LjU1QzI0LjQ0IDAgMCAyNC40NCAwIDU0LjU1VjQ1Ny40NEMwIDQ4Ny41NiAyNC40NCA1MTIgNTQuNTUgNTEySDMzMC40NEMzNjAuNTYgNTEyIDM4NCA0ODcuNTYgMzg0IDQ1Ny40NlYxNjBhMjQgMjQgMCAwMC0xNS0yMi41NnpNMTYwIDQxNkg5NmMtOC44NCAwLTE2LTcuMTYtMTYtMTZzNy4xNi0xNiAxNi0xNmg2NGM4Ljg0IDAgMTYgNy4xNiAxNiAxNnMtNy4xNiAxNi0xNiAxNnptNjQtOTZjLTM1LjM0NiAwLTY0LTI4LjY1NC02NC02NHM2NC02NCA2NC02NHM2NCAyOC42NTQgNjQgNjRzLTI4LjY1NCA2NC02NCA2NHptNjQtMTI4aC02NGMtOC44NCAwLTE2LTcuMTYtMTYtMTZzNy4xNi0xNiAxNi0xNmg2NGM4Ljg0IDAgMTYgNy4xNiAxNiAxNnMtNy4xNiAxNi0xNiAxNnptNjQtOTZoLTY0Yy04Ljg0IDAtMTYtNy4xNi0xNi0xNnMyOC42NTQtNjQgNjQtNjRzNjQgMjguNjU0IDY0IDY0czI4LjY1NCA2NC02NCA2NHYtMTYwYy04Ljg0IDAtMTYtNy4xNi0xNi0xNnMtNy4xNi0xNi0xNi0xNnptLTY0IDMyYzAtMTcuNjczIDE0LjMyNy0zMiAzMi0zMnMyOC42NTQgNjQtNjQgNjRzNjQgMjguNjU0IDY0IDY0czI4LjY1NCA2NC02NCA2NHpNMjU2IDM1MmMwIDM1LjM0Ni0yOC42NTQgNjQtNjQgNjRzLTY0LTI4LjY1NC02NC02NHMyOC42NTQtNjQgNjQtNjRzNjQgMjguNjU0IDY0IDY0eiIvPjwvc3ZnPj'); // Generic Word icon
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }, disabled: true });

  // This functionality is not available client-side.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('Word to PDF conversion is not available as an offline tool.');
  };

  return (
    <div>
      <h2>Word to PDF</h2>
      <Alert variant="warning">
        Word to PDF conversion is not available as an offline tool. This feature requires server-side processing.
      </Alert>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {file ? (
          <div style={{ textAlign: 'center' }}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Word Document" style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }} />
            ) : (
              <div style={{ width: '100px', height: '100px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                No Preview
              </div>
            )}
            <p style={{ fontSize: '0.8em', marginTop: '5px' }}>{file.name}</p>
          </div>
        ) : (
          <p>Drag 'n' drop a Word file here, or click to select a file (This feature is disabled)</p>
        )}
      </div>
      <Form onSubmit={handleSubmit} className="mt-3">
        <Button variant="primary" type="submit" disabled={true}>
          Convert to PDF (Unavailable)
        </Button>
      </Form>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default WordToPdf;
