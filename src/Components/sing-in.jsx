import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { login } from "../appwrite";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/home"); // Переход на главную страницу после успешного входа
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: "auto", marginTop: 50 }}
    >
      <h2>Вход</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group controlId="formEmail" className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group controlId="formPassword" className="mb-3">
        <Form.Label>Пароль</Form.Label>
        <Form.Control
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Войти
      </Button>
    </Form>
  );
};

export default LoginForm;
