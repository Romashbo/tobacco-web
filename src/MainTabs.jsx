// MainTabs.jsx
import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import TobaccoList from "./Components/TobaccoList";
import OrderTobacco from "./Components/OrderTobacco";
import "./App.css"; // Импортируйте стили, если они есть

const MainTabs = () => {
  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>Табак Канада бар</h1>
      <Tabs defaultActiveKey="home" className="mb-3" fill>
        <Tab eventKey="home" title="Коробка">
          <TobaccoList />
        </Tab>
        <Tab eventKey="profile" title="Заявка">
          <OrderTobacco />
        </Tab>
      </Tabs>
    </div>
  );
};

export default MainTabs;
