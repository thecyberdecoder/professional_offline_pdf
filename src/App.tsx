import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import Merge from './components/Merge';
import Split from './components/Split';
import Compress from './components/Compress';
import Rotate from './components/Rotate';
import JpgToPdf from './components/JpgToPdf';
import AddWatermark from './components/AddWatermark';
import AddPageNumbers from './components/AddPageNumbers';
import Lock from './components/Lock';
import Unlock from './components/Unlock';
import WordToPdf from './components/WordToPdf';
import Home from './components/Home';
import Login from './components/Login'; // Import the new Login component
import AdminPanel from './components/AdminPanel'; // Will create this next
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('token') ? true : false;
  });
  const [userRole, setUserRole] = useState<string | null>(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
      } catch (e) {
        console.error("Failed to parse token:", e);
        return null;
      }
    }
    return null;
  });

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch (e) {
      console.error("Failed to parse token on login:", e);
      setUserRole(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  // Simple ProtectedRoute component
  const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) => {
    const navigate = useNavigate();
    useEffect(() => {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (adminOnly && userRole !== 'admin') {
        navigate('/'); // Redirect non-admins from admin routes
      }
    }, [isAuthenticated, adminOnly, userRole]);

    if (!isAuthenticated || (adminOnly && userRole !== 'admin')) {
      return null; // Or a loading spinner, or a message
    }
    return children;
  };

  return (
      <div className="app-container">
      <Navbar bg={theme} variant={theme} expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">Anti Terrorism Squad, Headquarters</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {isAuthenticated && (
                <>
                  <Nav.Link as={Link} to="/merge">Merge</Nav.Link>
                  <Nav.Link as={Link} to="/split">Split</Nav.Link>
                  <Nav.Link as={Link} to="/compress">Compress</Nav.Link>
                  <Nav.Link as={Link} to="/rotate">Rotate</Nav.Link>
                  <Nav.Link as={Link} to="/jpg-to-pdf">JPG to PDF</Nav.Link>
                  <Nav.Link as={Link} to="/add-watermark">Add Watermark</Nav.Link>
                  <Nav.Link as={Link} to="/add-page-numbers">Add Page Numbers</Nav.Link>
                  <Nav.Link as={Link} to="/lock">Lock PDF</Nav.Link>
                  <Nav.Link as={Link} to="/unlock">Unlock PDF</Nav.Link>
                  <Nav.Link as={Link} to="/word-to-pdf">Word to PDF</Nav.Link>
                  {userRole === 'admin' && (
                    <Nav.Link as={Link} to="/admin">Admin Panel</Nav.Link>
                  )}
                </>
              )}
            </Nav>
            <Button variant="outline-secondary" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="theme-toggle-button">
              Toggle Theme
            </Button>
            {isAuthenticated && (
              <Button variant="outline-danger" onClick={handleLogout} className="ms-2">
                Logout
              </Button>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/merge" element={<ProtectedRoute><Merge /></ProtectedRoute>} />
          <Route path="/split" element={<ProtectedRoute><Split /></ProtectedRoute>} />
          <Route path="/compress" element={<ProtectedRoute><Compress /></ProtectedRoute>} />
          <Route path="/rotate" element={<ProtectedRoute><Rotate /></ProtectedRoute>} />
          <Route path="/jpg-to-pdf" element={<ProtectedRoute><JpgToPdf /></ProtectedRoute>} />
          <Route path="/add-watermark" element={<ProtectedRoute><AddWatermark /></ProtectedRoute>} />
          <Route path="/add-page-numbers" element={<ProtectedRoute><AddPageNumbers /></ProtectedRoute>} />
          <Route path="/lock" element={<ProtectedRoute><Lock /></ProtectedRoute>} />
          <Route path="/unlock" element={<ProtectedRoute><Unlock /></ProtectedRoute>} />
          <Route path="/word-to-pdf" element={<ProtectedRoute><WordToPdf /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;