import React, { useEffect, useState } from "react";
import Stack from "react-bootstrap/Stack";
import { Button, Form } from "react-bootstrap";
import "./tobaccoList.css";
import AddCalForm from "./addCalTobacco";
import { deleteCalTobacco, getCalTobacco } from "../appwrite";

const CalTobacco = () => {
  const [tobaccoList, setTobaccoList] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("Все");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCalTobacco();
        setTobaccoList(data);
      } catch (error) {
        console.error("Ошибка загрузки списка табака:", error);
      }
    };

    fetchData();
  }, []);

  const handleAddTobacco = (newItem) => {
    setTobaccoList((prev) => [newItem, ...prev]);
  };

  const handleDelete = async (item) => {
    try {
      await deleteCalTobacco(item.$id);
      setTobaccoList((prev) => prev.filter((i) => i.$id !== item.$id));
    } catch (error) {
      console.error("Ошибка удаления табака:", error);
    }
  };

  const filteredList =
    selectedBrand === "Все"
      ? tobaccoList
      : tobaccoList.filter((item) => item.brand === selectedBrand);

  return (
    <div>
      <AddCalForm onAdd={handleAddTobacco} />

      <Form.Select
        style={{ maxWidth: 300, marginBottom: 20, marginLeft: "10px" }}
        value={selectedBrand}
        onChange={(e) => setSelectedBrand(e.target.value)}
      >
        <option value="Все">Все бренды</option>
        {[...new Set(tobaccoList.map((t) => t.brand))].map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </Form.Select>

      <Stack gap={2}>
        {filteredList.length === 0 ? (
          <div style={{ marginLeft: "10px" }}>Избива нет.</div>
        ) : (
          filteredList.map((item) => (
            <div className="list" key={item.$id}>
              <span>{`${item.brand} - ${item.aroma}`}</span>
              <div style={{ display: "flex", gap: "10px" }}>
                <Button variant="danger" onClick={() => handleDelete(item)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))
        )}
      </Stack>
    </div>
  );
};

export default CalTobacco;
