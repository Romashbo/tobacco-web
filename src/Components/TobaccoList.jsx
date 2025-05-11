import React, { useEffect, useState } from "react";
import Stack from "react-bootstrap/Stack";
import { Button, Form } from "react-bootstrap";
import AddTobaccoForm from "./addTobaccoForm";
import { getTobaccoList, updateTobacco, deleteTobacco } from "../appwrite";
import "./tobaccoList.css";

const TobaccoList = () => {
  const [tobaccoList, setTobaccoList] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("Все");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTobaccoList();
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

  const handleIncrement = async (item) => {
    const updatedItem = { ...item, count: item.count + 1 };
    try {
      await updateTobacco(item.$id, { count: updatedItem.count });
      setTobaccoList((prev) =>
        prev.map((el) => (el.$id === item.$id ? updatedItem : el))
      );
    } catch (error) {
      console.error("Ошибка при увеличении количества табака:", error);
    }
  };

  const handleDecrement = async (item) => {
    if (item.count > 1) {
      const updatedItem = { ...item, count: item.count - 1 };
      try {
        await updateTobacco(item.$id, { count: updatedItem.count });
        setTobaccoList((prev) =>
          prev.map((el) => (el.$id === item.$id ? updatedItem : el))
        );
      } catch (error) {
        console.error("Ошибка при уменьшении количества табака:", error);
      }
    } else {
      try {
        await deleteTobacco(item.$id);
        setTobaccoList((prev) => prev.filter((el) => el.$id !== item.$id));
      } catch (error) {
        console.error("Ошибка при удалении табака:", error);
      }
    }
  };

  const filteredList =
    selectedBrand === "Все"
      ? tobaccoList
      : tobaccoList.filter((item) => item.brand === selectedBrand);

  return (
    <div>
      <AddTobaccoForm onAdd={handleAddTobacco} />

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
          <div style={{ marginLeft: "10px" }}>Табака в коробке нет.</div>
        ) : (
          filteredList.map((item) => (
            <div className="list" key={item.$id}>
              <span>{`${item.brand} - ${item.aroma}`}</span>
              <div style={{ display: "flex", gap: "10px" }}>
                <Button variant="danger" onClick={() => handleDecrement(item)}>
                  -
                </Button>
                <Button variant="light" disabled>
                  {item.count}
                </Button>
                <Button variant="success" onClick={() => handleIncrement(item)}>
                  +
                </Button>
              </div>
            </div>
          ))
        )}
      </Stack>
    </div>
  );
};

export default TobaccoList;
