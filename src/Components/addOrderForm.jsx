import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { createOrderTobacco } from "../appwrite";

const AddOrderForm = ({ onAdd }) => {
  const [brand, setBrand] = useState("");
  const [aroma, setAroma] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newTobacco = {
        brand,
        aroma,
      };

      const result = await createOrderTobacco(newTobacco);
      onAdd(result);
      setBrand("");
      setAroma("");
    } catch (error) {
      console.error("Ошибка при добавлении табака:", error);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="d-flex mb-3 align-items-center">
      <Form.Control
        type="text"
        placeholder="Бренд"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="me-2"
        required
        style={{ maxWidth: "150px" }}
      />
      <Form.Control
        type="text"
        placeholder="Вкус"
        value={aroma}
        onChange={(e) => setAroma(e.target.value)}
        className="me-2"
        required
        style={{ maxWidth: "150px" }}
      />

      <Button type="submit" variant="primary">
        +
      </Button>
    </Form>
  );
};

export default AddOrderForm;
