import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'react-bootstrap';
import { FaFilePdf, FaFileImage, FaCompressArrowsAlt, FaObjectUngroup, FaSyncAlt, FaLock, FaUnlock, FaFileWord, FaPaintBrush, FaFileSignature } from 'react-icons/fa';

const tools = [
  { to: '/merge', icon: <FaFilePdf />, title: 'Merge PDF', description: 'Combine multiple PDFs into one' },
  { to: '/split', icon: <FaObjectUngroup />, title: 'Split PDF', description: 'Extract pages from a PDF' },
  { to: '/compress', icon: <FaCompressArrowsAlt />, title: 'Compress PDF', description: 'Reduce the size of a PDF' },
  { to: '/rotate', icon: <FaSyncAlt />, title: 'Rotate PDF', description: 'Rotate pages in a PDF' },
  { to: '/jpg-to-pdf', icon: <FaFileImage />, title: 'JPG to PDF', description: 'Convert JPG images to a PDF' },
  { to: '/add-watermark', icon: <FaPaintBrush />, title: 'Add Watermark', description: 'Add a watermark to a PDF' },
  { to: '/add-page-numbers', icon: <FaFileSignature />, title: 'Add Page Numbers', description: 'Add page numbers to a PDF' },
  { to: '/lock', icon: <FaLock />, title: 'Lock PDF', description: 'Add a password to a PDF' },
  { to: '/unlock', icon: <FaUnlock />, title: 'Unlock PDF', description: 'Remove a password from a PDF' },
  { to: '/word-to-pdf', icon: <FaFileWord />, title: 'Word to PDF', description: 'Convert a Word document to a PDF' },
];

function Home() {
  return (
    <div>
      <h1 className="text-center mb-4">PDF Suite</h1>
      <Row xs={1} md={2} lg={3} className="g-4">
        {tools.map((tool, idx) => (
          <Col key={idx}>
            <Link to={tool.to} style={{ textDecoration: 'none' }}>
              <Card className="h-100 text-center shadow-sm">
                <Card.Body>
                  <div style={{ fontSize: '3rem', color: '#dc3545' }}>{tool.icon}</div>
                  <Card.Title className="mt-3">{tool.title}</Card.Title>
                  <Card.Text>{tool.description}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Home;
