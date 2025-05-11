// App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainTabs from "./MainTabs"; // <-- если есть MainTabs.jsx
import LoginForm from "./Components/sing-in";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <MainTabs />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
