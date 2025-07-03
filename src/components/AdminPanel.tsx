import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert } from 'react-bootstrap';

interface User {
  username: string;
  role: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users.');
      }
    } catch {
      setError('Network error or server is unreachable.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newUserRole }),
      });

      if (response.ok) {
        setMessage('User added successfully!');
        setNewUsername('');
        setNewPassword('');
        setNewUserRole('user');
        fetchUsers(); // Refresh the user list
      } else {
        try {
          const errorText = await response.text();
          setError(errorText || 'Failed to add user.');
        } catch (e) {
          setError('Failed to add user and could not parse error response.');
        }
      }
    } catch {
      setError('Network error or server is unreachable.');
    }
  };

  return (
    <Container className="mt-4">
      <h2>Admin Panel</h2>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <h3 className="mt-4">Add New User</h3>
      <Form onSubmit={handleAddUser} className="mb-4">
        <Form.Group className="mb-3" controlId="formNewUsername">
          <Form.Label>Username (Email)</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formNewPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formNewUserRole">
          <Form.Label>Role</Form.Label>
          <Form.Select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit">
          Add User
        </Button>
      </Form>

      <h3 className="mt-4">Existing Users</h3>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td>{user.username}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminPanel;
