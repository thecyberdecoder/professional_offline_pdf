import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa'; // Import icons

// Assuming a ThemeContext or similar is available from App.tsx
// For now, we'll mock it or assume it's passed via props if not global.
interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

// Mock useTheme hook for demonstration. In a real app, this would come from a context provider.
const useTheme = (): ThemeContextType => {
  const [theme, setTheme] = useState('light'); // Default theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    document.body.classList.toggle('dark-mode'); // Toggle dark-mode class on body
  };
  return { theme, toggleTheme };
};

interface LoginProps {
  onLogin: (token: string) => void;
}

const generateCaptcha = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars[Math.floor(Math.random() * chars.length)];
  }
  return captcha;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Use the theme hook

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaInput !== captcha) {
      setError('CAPTCHA mismatch. Please try again.');
      setCaptcha(generateCaptcha()); // Regenerate CAPTCHA on failure
      setCaptchaInput('');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.accessToken);
        navigate('/'); // Redirect to home or dashboard after successful login
      } else {
        const errorText = await response.text();
        setError(errorText || 'Login failed.');
        setCaptcha(generateCaptcha()); // Regenerate CAPTCHA on login failure
        setCaptchaInput('');
      }
    } catch {
      setError('Network error or server is unreachable.');
      setCaptcha(generateCaptcha()); // Regenerate CAPTCHA on network error
      setCaptchaInput('');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center login-container" fluid>
      <div className="theme-toggle-icon" onClick={toggleTheme}>
        {theme === 'light' ? <FaMoon size={24} /> : <FaSun size={24} color="white" />}
      </div>
      <Card className="login-card shadow-lg p-4">
        <Card.Body>
          <div className="text-center mb-4">
            <img src="/indian-flag.svg" alt="Indian Flag" className="indian-flag-icon mb-3" />
            <h2 className="login-title">Offline PDF Toolkit</h2>
            <p className="powered-by-text">Powered by ATS Headquarters</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicCaptcha">
              <Form.Label>CAPTCHA</Form.Label>
              <Row className="align-items-center">
                <Col xs={6}>
                  <div className="captcha-display p-2 text-center border rounded fs-4 fw-bold user-select-none">
                    {captcha}
                  </div>
                </Col>
                <Col xs={6}>
                  <Form.Control
                    type="text"
                    placeholder="Enter CAPTCHA"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                  />
                </Col>
              </Row>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mt-3 login-button">
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;