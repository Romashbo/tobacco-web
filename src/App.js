import logo from "./logo.svg";
import "./App.css";
import TobaccoList from "./Components/TobaccoList";

import { Tab, Tabs } from "react-bootstrap";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import OrderTobacco from "./Components/OrderTobacco";
import CalTobacco from "./Components/CalTobacco";
import WorkTab from "./Components/WorkTab";

function App() {
  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>Табак Канада бар</h1>
      <Tabs defaultActiveKey="WorkTab" className="mb-3 gap-2" fill>
        <Tab eventKey="WorkTab" title="Рабочий экран">
          <DndProvider backend={HTML5Backend}>
            <WorkTab />
          </DndProvider>
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
