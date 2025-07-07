import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Badge,
  Collapse,
} from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";

const TIMER_DURATION = 15 * 60 * 1000;
const SOCKET_URL = "ws://localhost:4000"; // 🔁 Укажи свой адрес

const ZONES = {
  Зал: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  Веранда: [20, 205, 21, 22, 225, 23, 24, 25, 26, 265],
  Патио: [27, 28, 29, 295, 30, 31, 32, 33, 34, 35],
  Лавки: [40, 41, 42, 43, 44, 45, 60, 61, 62, 63],
  Беседка: [50, 51, 52],
};

function WorkTab() {
  const [sessions, setSessions] = useState([]);
  const [showTables, setShowTables] = useState(true);
  const socketRef = useRef(null);

  // Подключение к WebSocket
  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "updateSessions") {
        setSessions(data.sessions);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  const broadcastSessions = (updatedSessions) => {
    setSessions(updatedSessions);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "updateSessions",
          sessions: updatedSessions,
        })
      );
    }
  };

  const handleTableClick = (tableId) => {
    const tableSessions = sessions.filter((s) => s.tableId === tableId);
    if (
      tableSessions.length === 0 ||
      tableSessions.some((s) => s.phase !== "done")
    ) {
      const newSessions = [
        ...sessions,
        {
          id: uuidv4(),
          tableId,
          phase: "preparing",
          startTime: Date.now(),
        },
      ];
      broadcastSessions(newSessions);
    }
  };

  const handleSessionClick = (sessionId) => {
    const updated = sessions
      .map((s) => {
        if (s.id !== sessionId) return s;
        if (s.phase === "preparing")
          return { ...s, phase: "first", startTime: Date.now() };
        if (s.phase === "first")
          return { ...s, phase: "second", startTime: Date.now() };
        if (s.phase === "second") return { ...s, phase: "done" };
        return s;
      })
      .filter((s) => s.phase !== "done");

    broadcastSessions(updated);
  };

  const renderTimer = (startTime) => {
    const elapsed = Date.now() - startTime;
    const remaining = TIMER_DURATION - elapsed;
    const minutes = Math.max(Math.floor(remaining / 60000), 0);
    const isOverdue = remaining <= 0;
    return <Badge bg={isOverdue ? "danger" : "secondary"}>{minutes} мин</Badge>;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const firstSessions = sessions
    .filter((s) => s.phase === "first")
    .sort((a, b) => a.startTime - b.startTime);

  const secondSessions = sessions
    .filter((s) => s.phase === "second")
    .sort((a, b) => a.startTime - b.startTime);

  const preparingSessions = sessions.filter((s) => s.phase === "preparing");

  const renderSessions = (sessionList, title) => (
    <div className="mb-4">
      <h5 className="border-bottom pb-2">{title}</h5>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {sessionList.map((session) => (
          <div key={session.id} style={{ width: "6rem" }}>
            <Card
              onClick={() => handleSessionClick(session.id)}
              style={{ cursor: "pointer", textAlign: "center" }}
              border={
                session.phase === "preparing"
                  ? "primary"
                  : session.phase === "first"
                  ? "warning"
                  : "success"
              }
            >
              <Card.Body className="p-2">
                <div className="fw-bold">{session.tableId}</div>
                <div>{renderTimer(session.startTime)}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  const renderZone = (zoneName, tableIds) => (
    <div key={zoneName} className="mb-3">
      <h6 className="mb-2">{zoneName}</h6>
      <Row>
        {tableIds.map((tableId) => {
          const isActive = sessions.some(
            (s) => s.tableId === tableId && s.phase !== "done"
          );
          return (
            <Col key={tableId} xs="auto" className="mb-2">
              <Button
                style={{ width: "3.2rem" }}
                variant={isActive ? "primary" : "outline-primary"}
                onClick={() => handleTableClick(tableId)}
              >
                {tableId}
              </Button>
            </Col>
          );
        })}
      </Row>
    </div>
  );

  return (
    <Container className="py-4">
      <h3 className="mb-3">Столы</h3>

      <div className="mb-3">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowTables((prev) => !prev)}
        >
          {showTables ? "Скрыть столы" : "Показать столы"}
        </Button>
      </div>

      <Collapse in={showTables}>
        <div>
          {Object.entries(ZONES).map(([zoneName, tableIds]) =>
            renderZone(zoneName, tableIds)
          )}
        </div>
      </Collapse>

      {preparingSessions.length > 0 &&
        renderSessions(preparingSessions, "Готовятся")}
      {firstSessions.length > 0 &&
        renderSessions(firstSessions, "Первая замена")}
      {secondSessions.length > 0 &&
        renderSessions(secondSessions, "Вторая замена")}
    </Container>
  );
}

export default WorkTab;
