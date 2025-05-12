import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { createCalTobacco } from "../appwrite";
import "./addForm.css";

const AddCalForm = ({ onAdd }) => {
  const [brand, setBrand] = useState("");
  const [aroma, setAroma] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newTobacco = {
        brand: brand.trim(),
        aroma: aroma.trim(),
      };

      const result = await createCalTobacco(newTobacco);
      onAdd(result);
      setBrand("");
      setAroma("");
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

      <Button type="submit" variant="primary">
        +
      </Button>
    </Form>
  );
};

export default AddCalForm;
