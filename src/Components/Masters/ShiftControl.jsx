import React from "react";
import { Badge, Button } from "react-bootstrap";

export default function ShiftControl({
  employee,
  shiftStart,
  completedCount,
  onReset,
  onCloseShift,
  onBack,
  onShowHistory,
}) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        <div className="fw-bold">Смена: {employee?.name}</div>
        <div className="text-muted" style={{ fontSize: 12 }}>
          Начало: {shiftStart ? new Date(shiftStart).toLocaleTimeString() : "-"}
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <Badge bg="success">
          Всего шиша: <span className="ms-1">{completedCount}</span>
        </Badge>
        <Button variant="outline-secondary" size="sm" onClick={onShowHistory}>
          История
        </Button>
        <Button variant="outline-danger" size="sm" onClick={onReset}>
          Сбросить
        </Button>
        <Button variant="primary" size="sm" onClick={onCloseShift}>
          Закрыть смену
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onBack}>
          Сменить сотрудника
        </Button>
      </div>
    </div>
  );
}
