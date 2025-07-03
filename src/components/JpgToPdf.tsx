import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';


function JpgToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    const urls = acceptedFiles.map(file => URL.createObjectURL(file));
    setThumbnailUrls(urls);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/jpeg': ['.jpeg', '.jpg'] }, multiple: true });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one JPG file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // JPG to PDF conversion functionality using pdf-lib has been removed.
      // If you need this functionality, a new WASM-based library or server-side implementation will be required.
      // const newPdf = await PDFDocument.create();

      // for (const file of files) {
      //   const imageBytes = await file.arrayBuffer();
      //   const image = await newPdf.embedJpg(imageBytes);
      //   const page = newPdf.addPage();
      //   page.drawImage(image, {
      //     x: 0,
      //     y: 0,
      //     width: page.getWidth(),
      //     height: page.getHeight(),
      //   });
      // }

      // const pdfBytes = await newPdf.save();
      const pdfBytes = await files[0].arrayBuffer(); // Placeholder: returns the first file as is
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred during conversion.');
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>JPG to PDF</h2>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <div>
            <p>Selected files:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {thumbnailUrls.map((url, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  {url ? (
                    <img src={url} alt="JPG Thumbnail" style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                      No Preview
                    </div>
                  )}
                  <p style={{ fontSize: '0.8em', marginTop: '5px' }}>{files[index].name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>Drag 'n' drop JPG files here, or click to select files</p>
        )}
      </div>
      <Form onSubmit={handleSubmit} className="mt-3">
        <Button variant="primary" type="submit" disabled={loading || files.length === 0}>
          {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Convert to PDF'}
        </Button>
      </Form>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
}

export default JpgToPdf;