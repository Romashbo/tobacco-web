import logo from "./logo.svg";
import "./App.css";
import TobaccoList from "./Components/TobaccoList";

import { Tab, Tabs } from "react-bootstrap";
import AddTobaccoForm from "./Components/addTobaccoForm";
import OrderTobacco from "./Components/OrderTobacco";

function App() {
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
}

export default App;
