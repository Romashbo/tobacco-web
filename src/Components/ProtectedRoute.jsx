// Components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account } from "../appwrite"; // Экспортируй его отдельно в appwrite.js

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        await account.get();
        setAuthenticated(true);
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (loading) return <p style={{ textAlign: "center" }}>Загрузка...</p>;

  return authenticated ? children : null;
};

export default ProtectedRoute;
