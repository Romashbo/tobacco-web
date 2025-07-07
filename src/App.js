import logo from "./logo.svg";
import "./App.css";
import TobaccoList from "./Components/TobaccoList";

import { Tab, Tabs } from "react-bootstrap";
import AddTobaccoForm from "./Components/addTobaccoForm";
import OrderTobacco from "./Components/OrderTobacco";
import CalTobacco from "./Components/CalTobacco";
import WorkTab from "./Components/WorkTab";

function App() {
  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>Табак Канада бар</h1>
      <Tabs defaultActiveKey="WorkTab" className="mb-3" fill>
        <Tab eventKey="WorkTab" title="Рабочий экран">
          <WorkTab />
        </Tab>
        <Tab eventKey="home" title="Коробка">
          <TobaccoList />
        </Tab>
        <Tab eventKey="order" title="Заявка">
          <OrderTobacco />
        </Tab>
        <Tab eventKey="cal" title="Избив">
          <CalTobacco />
        </Tab>
      </Tabs>
    </div>
  );
}

export default App;
