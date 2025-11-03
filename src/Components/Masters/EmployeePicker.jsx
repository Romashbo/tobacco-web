import React from "react";
import { Button, Row, Col } from "react-bootstrap";

// 4 сотрудника (переименуй как нужно)
const EMPLOYEES = [
  { id: "e1", name: "Роман" },
  { id: "e2", name: "Ростислав" },
  { id: "e3", name: "Даня" },
  { id: "e4", name: "Мотя" },
];

export default function EmployeePicker({ onPick, multi = true }) {
  const [selected, setSelected] = useState([]);

  const toggle = (emp) => {
    if (!multi) {
      setSelected([emp]);
      onPick([emp]);
      return;
    }
    const exists = selected.find((e) => e.id === emp.id);
    const next = exists
      ? selected.filter((e) => e.id !== emp.id)
      : [...selected, emp];
    setSelected(next);
  };

  return (
    <>
      <h5 className="mb-3">Кто на смене?</h5>
      <Row className="g-2 mb-2">
        {EMPLOYEES.map((e) => {
          const active = selected.some((x) => x.id === e.id);
          return (
            <Col key={e.id} xs="auto">
              <Button
                variant={active ? "primary" : "outline-primary"}
                onClick={() => toggle(e)}
              >
                {e.name}
              </Button>
            </Col>
          );
        })}
      </Row>
      {multi ? (
        <div className="d-flex align-items-center gap-2">
          <Button
            onClick={() => onPick(selected)}
            disabled={selected.length === 0}
          >
            Начать смену
          </Button>
          {selected.length > 0 && (
            <div className="d-flex gap-1 flex-wrap">
              {selected.map((e) => (
                <Badge key={e.id} bg="secondary">
                  {e.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
