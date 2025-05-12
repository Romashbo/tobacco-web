import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { createTobacco } from "../appwrite";
import "./addForm.css";

const AddTobaccoForm = ({ onAdd }) => {
  const [brand, setBrand] = useState("");
  const [aroma, setAroma] = useState("");
  const [count, setCount] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newTobacco = {
        brand: brand.trim(),
        aroma: aroma.trim(),
        count,
      };

      const result = await createTobacco(newTobacco);
      onAdd(result);
      setBrand("");
      setAroma("");
      setCount(1);
    } catch (error) {
      console.error("Ошибка при добавлении табака:", error);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="form-container">
      <Form.Control
        type="text"
        placeholder="Бренд"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="form-control-flex"
        required
      />
      <Form.Control
        type="text"
        placeholder="Аромат"
        value={aroma}
        onChange={(e) => setAroma(e.target.value)}
        className="form-control-flex"
        required
      />
      <Form.Control
        type="number"
        value={count}
        min={1}
        onChange={(e) => setCount(parseInt(e.target.value))}
        className="form-control-flex form-control-count"
        required
      />
      <Button type="submit" variant="primary" className="submit-button">
        +
      </Button>
    </Form>
  );
};

export default AddTobaccoForm;
