// src/Components/WorkTab.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Collapse,
  Container,
  Dropdown,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import {
  ensureSession,
  listShiftsByEmployee,
  createShift,
  deleteAllShifts, // ← добавь в appwrite.js по инструкции
} from "../appwrite"; // проверь путь

/* ===== Константы ===== */
const TIMER_DURATION = 20 * 60 * 1000; // 20 минут
const SOCKET_URL = "wss://websocket-server-production-8233.up.railway.app";

const ZONES = {
  Зал: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  Веранда: [20, 205, 21, 22, 225, 23, 24, 25, 26, 265],
  Патио: [27, 28, 29, 295, 30, 31, 32, 33, 34, 35],
  Лавки: [40, 41, 42, 43, 44, 45, 60, 61, 62, 63],
  Беседка: [50, 51, 52],
};

const EMPLOYEES = [
  { id: "Рома", name: "Рома" },
  { id: "Рост", name: "Рост" },
  { id: "Даня", name: "Даня" },
  { id: "Мотя", name: "Мотя" },
];

/* ===== Вспомогалки ===== */
function useLongPress(callback, { ms = 800 } = {}) {
  const timerRef = useRef(null);
  const start = (e) => {
    if (e.type === "touchstart") e.preventDefault();
    clear();
    timerRef.current = setTimeout(() => {
      callback();
      clear();
    }, ms);
  };
  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}

/* ===== Компонент ===== */
export default function WorkTab() {
  // рабочее состояние
  const [sessions, setSessions] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [showTables, setShowTables] = useState(false);

  // сотрудники/смена
  const [selectedEmployees, setSelectedEmployees] = useState([]); // [{id,name}, ...]
  const [shiftStart, setShiftStart] = useState(null);

  // настройки / история / суммы (рабочего экрана)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [history, setHistory] = useState([]); // история выбранного из меню
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [totalsAllTime, setTotalsAllTime] = useState({}); // {empId: total}

  // закрытие смены
  const [closing, setClosing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(""); // авто закрывается через 3с

  // экран выбора сотрудников
  const [pickerSelected, setPickerSelected] = useState([]);
  const [pickerSettingsOpen, setPickerSettingsOpen] = useState(false);
  const [pickerLoadingTotals, setPickerLoadingTotals] = useState(false);
  const [pickerTotals, setPickerTotals] = useState({}); // {empId: total}
  const [pickerLoadingHistoryFor, setPickerLoadingHistoryFor] = useState(null); // empId | null
  const [pickerHistory, setPickerHistory] = useState([]); // история в пикере
  const [pickerDeletingAll, setPickerDeletingAll] = useState(false); // удаление всех записей

  // websocket (всегда наверху, безусловно)
  const socketRef = useRef(null);
  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);
    socketRef.current = ws;
    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data?.type === "syncState") {
          setSessions(Array.isArray(data.sessions) ? data.sessions : []);
          setCompletedCount(
            typeof data.completedCount === "number" ? data.completedCount : 0
          );
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };
    return () => ws.close();
  }, []);

  const broadcastState = (nextSessions, nextCompleted) => {
    setSessions(nextSessions);
    setCompletedCount(nextCompleted);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "updateState",
          sessions: nextSessions,
          completedCount: nextCompleted,
        })
      );
    }
  };
  const broadcastSessions = (next) => broadcastState(next, completedCount);

  // обновление таймеров раз в минуту
  useEffect(() => {
    const id = setInterval(() => setSessions((p) => [...p]), 60_000);
    return () => clearInterval(id);
  }, []);

  // секции
  const preparingSessions = useMemo(
    () => sessions.filter((s) => s.phase === "preparing"),
    [sessions]
  );
  const firstSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.phase === "first")
        .sort((a, b) => a.startTime - b.startTime),
    [sessions]
  );
  const secondSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.phase === "second")
        .sort((a, b) => a.startTime - b.startTime),
    [sessions]
  );

  // автозагрузка сумм при изменении состава (рабочий экран)
  useEffect(() => {
    (async () => {
      if (selectedEmployees.length === 0) {
        setTotalsAllTime({});
        return;
      }
      try {
        await ensureSession?.();
        const pairs = await Promise.all(
          selectedEmployees.map(async (e) => {
            const docs = await listShiftsByEmployee(e.id, 1000);
            const total = docs.reduce(
              (sum, d) => sum + (Number(d.count) || 0),
              0
            );
            return [e.id, total];
          })
        );
        setTotalsAllTime(Object.fromEntries(pairs));
      } catch (e) {
        console.error("totals load error", e);
      }
    })();
  }, [selectedEmployees]);

  // авто-закрытие плашки успеха через 3 сек
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  /* ===== Логика рабочего экрана ===== */
  const handleTableClick = (tableId) => {
    if (closing) return;
    const tableSessions = sessions.filter((s) => s.tableId === tableId);
    if (
      tableSessions.length === 0 ||
      tableSessions.some((s) => s.phase !== "done")
    ) {
      const next = [
        ...sessions,
        {
          id: uuidv4(),
          tableId,
          phase: "preparing",
          startTime: Date.now(),
          alerted: false,
        },
      ];
      broadcastSessions(next);
    }
  };

  const handleSessionClick = (sessionId) => {
    if (closing) return;
    let didComplete = false;
    const updated = sessions
      .map((s) => {
        if (s.id !== sessionId) return s;
        if (s.phase === "preparing")
          return { ...s, phase: "first", startTime: Date.now() };
        if (s.phase === "first")
          return { ...s, phase: "second", startTime: Date.now() };
        if (s.phase === "second") {
          didComplete = true;
          return { ...s, phase: "done" };
        }
        return s;
      })
      .filter((s) => s.phase !== "done");
    broadcastState(updated, didComplete ? completedCount + 1 : completedCount);
  };

  const removeSessionById = (id) => {
    if (closing) return;
    const remaining = sessions.filter((s) => s.id !== id);
    broadcastState(remaining, completedCount); // без инкремента
  };

  const renderTimer = (startTime) => {
    const elapsed = Date.now() - startTime;
    const remaining = TIMER_DURATION - elapsed;
    const minutes = Math.max(Math.floor(remaining / 60000), 0);
    const isOverdue = remaining <= 0;
    return <Badge bg={isOverdue ? "danger" : "secondary"}>{minutes} мин</Badge>;
  };

  const SessionCard = ({ session }) => {
    const wasLong = useRef(false);
    const longBind = useLongPress(() => {
      wasLong.current = true;
      removeSessionById(session.id);
    });
    return (
      <div style={{ width: "6rem", opacity: closing ? 0.6 : 1 }}>
        <Card
          {...(!closing ? longBind : {})}
          onClick={() => {
            if (closing) return;
            if (wasLong.current) {
              wasLong.current = false;
              return;
            }
            handleSessionClick(session.id);
          }}
          style={{
            cursor: closing ? "not-allowed" : "pointer",
            textAlign: "center",
          }}
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
    );
  };

  const renderSessions = (list, title) =>
    list.length ? (
      <div className="mb-4">
        <h5 className="border-bottom pb-2">{title}</h5>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {list.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </div>
    ) : null;

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
                disabled={closing}
              >
                {tableId}
              </Button>
            </Col>
          );
        })}
      </Row>
    </div>
  );

  const handleResetCount = () => {
    if (closing) return;
    broadcastState(sessions, 0);
  };

  const loadHistoryFor = async (emp) => {
    setLoadingHistory(true);
    try {
      await ensureSession?.();
      const docs = await listShiftsByEmployee(emp.id, 50);
      setHistory(docs);
    } catch (e) {
      console.error(e);
      alert("Не удалось загрузить историю смен");
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeShift = async () => {
    if (selectedEmployees.length === 0 || closing) return;
    setClosing(true);
    setSuccessMsg("");
    try {
      await ensureSession?.();

      const n = selectedEmployees.length;
      const total = completedCount;
      const baseShare = Math.floor(total / n);
      let remainder = total % n;

      // тянем актуальные суммарные итоги
      const totals = {};
      for (const e of selectedEmployees) {
        const docs = await listShiftsByEmployee(e.id, 1000);
        totals[e.id] = docs.reduce((sum, d) => sum + (Number(d.count) || 0), 0);
      }

      // распределяем остаток тем, у кого меньше суммарно
      const sorted = [...selectedEmployees].sort(
        (a, b) => (totals[a.id] || 0) - (totals[b.id] || 0)
      );

      const allocation = new Map();
      for (const e of selectedEmployees) allocation.set(e.id, baseShare);
      for (let i = 0; i < remainder; i++) {
        const id = sorted[i % sorted.length].id;
        allocation.set(id, allocation.get(id) + 1);
      }

      const startedAt = new Date(shiftStart || Date.now()).toISOString();
      const endedAt = new Date().toISOString();

      for (const e of selectedEmployees) {
        const count = allocation.get(e.id);
        await createShift({
          employeeId: e.id,
          employeeName: e.name,
          count,
          startedAt,
          endedAt,
        });
      }

      // успех
      setSuccessMsg("Смена закрыта.");

      // очистка и возврат на выбор
      broadcastState([], 0);
      setShowTables(false);
      setSettingsOpen(false);
      setHistory([]);
      setSelectedEmployees([]);
      setPickerSelected([]);
      setShiftStart(null);
      setTotalsAllTime({});
    } catch (e) {
      console.error(e);
      alert(String(e?.message || e || "Не удалось записать смену в Appwrite"));
    } finally {
      setClosing(false);
    }
  };

  /* ===== Логика экрана выбора (шестерёнка) ===== */
  const pickerLoadTotals = async () => {
    try {
      setPickerLoadingTotals(true);
      await ensureSession?.();
      const pairs = await Promise.all(
        EMPLOYEES.map(async (e) => {
          const docs = await listShiftsByEmployee(e.id, 1000);
          const total = docs.reduce(
            (sum, d) => sum + (Number(d.count) || 0),
            0
          );
          return [e.id, total];
        })
      );
      setPickerTotals(Object.fromEntries(pairs));
    } catch (e) {
      console.error(e);
    } finally {
      setPickerLoadingTotals(false);
    }
  };

  const pickerLoadHistory = async (emp) => {
    setPickerLoadingHistoryFor(emp.id);
    try {
      await ensureSession?.();
      const docs = await listShiftsByEmployee(emp.id, 200);
      setPickerHistory(docs);
    } catch (e) {
      console.error(e);
      alert("Не удалось загрузить историю");
    } finally {
      setPickerLoadingHistoryFor(null);
    }
  };

  const pickerDeleteAllShifts = async () => {
    const ok = window.confirm(
      "Удалить ВСЕ записи смен для ВСЕХ сотрудников? Действие необратимо."
    );
    if (!ok) return;

    setPickerDeletingAll(true);
    try {
      await ensureSession?.();
      const res = await deleteAllShifts();
      // очистим локальные состояния сумм/историй
      setPickerTotals({});
      setPickerHistory([]);
      alert(`Удалено записей: ${res?.deleted ?? 0}`);
    } catch (e) {
      console.error(e);
      alert(String(e?.message || e || "Не удалось удалить все записи"));
    } finally {
      setPickerDeletingAll(false);
    }
  };

  /* ===== Рендер ===== */
  return (
    <Container className="py-4">
      {successMsg && (
        <Alert variant="success" className="mb-3">
          {successMsg}
        </Alert>
      )}

      {/* Экран выбора сотрудников */}
      {selectedEmployees.length === 0 ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Кто на смене?</h5>

            {/* ⚙️ шестерёнка на экране выбора */}
            <Dropdown as={ButtonGroup}>
              <Button
                variant="outline-secondary"
                onClick={async () => {
                  setPickerSettingsOpen((v) => !v);
                  if (!pickerSettingsOpen) await pickerLoadTotals();
                }}
              >
                ⚙️
              </Button>
              <Dropdown.Toggle
                split
                variant="outline-secondary"
                id="picker-gear-split"
              />
              <Dropdown.Menu align="end">
                {EMPLOYEES.map((e) => (
                  <Dropdown.Item
                    key={e.id}
                    onClick={() => pickerLoadHistory(e)}
                  >
                    История: {e.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Панель настроек выбора: суммы, история, удалить ВСЕ */}
          <Collapse in={pickerSettingsOpen}>
            <div className="mb-3">
              <Card>
                <Card.Body>
                  <div className="fw-bold mb-2">Суммарно:</div>
                  {pickerLoadingTotals ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <div className="d-flex gap-2 flex-wrap">
                      {EMPLOYEES.map((e) => (
                        <Badge key={e.id} bg="success">
                          {e.name}: {pickerTotals[e.id] ?? "…"}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* История выбранного в пикере */}
                  {pickerHistory.length > 0 && (
                    <>
                      <div className="mt-3 d-flex align-items-center justify-content-between">
                        <div className="fw-bold">История</div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setPickerHistory([])}
                        >
                          Закрыть
                        </Button>
                      </div>
                      <ListGroup className="mt-2">
                        {pickerHistory.map((doc) => (
                          <ListGroup.Item
                            key={doc.$id}
                            className="d-flex justify-content-between"
                          >
                            <span>
                              {doc.workDate} — {doc.count} шиша —{" "}
                              {doc.employeeName}
                            </span>
                            <span
                              className="text-muted"
                              style={{ fontSize: 12 }}
                            >
                              {new Date(doc.startedAt).toLocaleTimeString()} —{" "}
                              {new Date(doc.endedAt).toLocaleTimeString()}
                            </span>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </>
                  )}

                  {/* Тотальное удаление: ВСЕ записи по всем сотрудникам */}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={pickerDeleteAllShifts}
                      disabled={pickerDeletingAll}
                    >
                      {pickerDeletingAll ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Сбрасываю…
                        </>
                      ) : (
                        "Сбросить смены"
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Collapse>

          {/* Кнопки сотрудников */}
          <Row className="g-2 mb-2">
            {EMPLOYEES.map((e) => {
              const active = pickerSelected.some((x) => x.id === e.id);
              return (
                <Col key={e.id} xs="auto">
                  <Button
                    variant={active ? "primary" : "outline-primary"}
                    onClick={() => {
                      setPickerSelected((prev) =>
                        prev.some((x) => x.id === e.id)
                          ? prev.filter((x) => x.id !== e.id)
                          : [...prev, e]
                      );
                    }}
                    disabled={closing}
                  >
                    {e.name}
                  </Button>
                </Col>
              );
            })}
          </Row>

          <div className="d-flex align-items-center gap-2">
            <Button
              onClick={() => {
                if (pickerSelected.length === 0) return;
                setSelectedEmployees(pickerSelected);
                setShiftStart(Date.now());
                setSuccessMsg("");
              }}
              disabled={pickerSelected.length === 0 || closing}
            >
              Начать смену
            </Button>
            {pickerSelected.length > 0 && (
              <div className="d-flex gap-1 flex-wrap">
                {pickerSelected.map((e) => (
                  <Badge key={e.id} bg="secondary">
                    {e.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Верхняя строка: сотрудники + шестерёнка (рабочая) */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold">Смена:</span>
              {selectedEmployees.map((e) => (
                <Badge key={e.id} bg="secondary">
                  {e.name}
                </Badge>
              ))}
            </div>

            <Dropdown as={ButtonGroup}>
              <Button
                variant="outline-secondary"
                onClick={() => setSettingsOpen((v) => !v)}
                disabled={closing}
              >
                {closing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Обработка...
                  </>
                ) : (
                  "⚙️"
                )}
              </Button>
              <Dropdown.Toggle
                split
                variant="outline-secondary"
                id="dropdown-split-basic"
                disabled={closing}
              />
              <Dropdown.Menu align="end">
                {selectedEmployees.map((e) => (
                  <Dropdown.Item key={e.id} onClick={() => loadHistoryFor(e)}>
                    История: {e.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Панель настроек рабочего экрана: суммы и закрытие смены */}
          <Collapse in={settingsOpen}>
            <div className="mb-3">
              <Card>
                <Card.Body className="d-flex flex-column gap-2">
                  <div>
                    <div className="fw-bold mb-1">Суммарно за всё время:</div>
                    <div className="d-flex gap-2 flex-wrap">
                      {selectedEmployees.map((e) => (
                        <Badge key={e.id} bg="success">
                          {e.name}: {totalsAllTime[e.id] ?? "…"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={closeShift}
                      disabled={closing}
                    >
                      {closing ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Закрываю…
                        </>
                      ) : (
                        "Закрыть смену"
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Collapse>

          {/* Кнопка Показать/Скрыть столы — снаружи */}
          <div className="mb-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowTables((v) => !v)}
              disabled={closing}
            >
              {showTables ? "Скрыть столы" : "Показать столы"}
            </Button>
          </div>

          {/* Зоны/столы */}
          <Collapse in={showTables}>
            <div className="mb-3">
              {Object.entries(ZONES).map(([zoneName, tableIds]) => (
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
                            disabled={closing}
                          >
                            {tableId}
                          </Button>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ))}
            </div>
          </Collapse>

          {/* Секции текущей смены */}
          {preparingSessions.length > 0 &&
            renderSessions(preparingSessions, "Готовятся")}
          {firstSessions.length > 0 &&
            renderSessions(firstSessions, "Первая замена")}
          {secondSessions.length > 0 &&
            renderSessions(secondSessions, "Вторая замена")}

          {/* История (рабочая) + кнопка закрыть */}
          {history.length > 0 && (
            <>
              <div className="mt-3 d-flex align-items-center justify-content-between">
                <h6 className="m-0">История смен</h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setHistory([])}
                >
                  Закрыть
                </Button>
              </div>
              <ListGroup className="mt-2">
                {history.map((doc) => (
                  <ListGroup.Item
                    key={doc.$id}
                    className="d-flex justify-content-between"
                  >
                    <span>
                      {doc.workDate} — {doc.count} шиша
                    </span>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {new Date(doc.startedAt).toLocaleTimeString()} —{" "}
                      {new Date(doc.endedAt).toLocaleTimeString()}
                    </span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}

          {/* Итог текущей смены внизу (со сбросом) */}
          <Alert
            variant="success"
            className="d-flex justify-content-between align-items-center mt-3"
          >
            <div>✅ Всего шиша (текущая смена): {completedCount}</div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleResetCount}
              disabled={closing}
            >
              Сбросить
            </Button>
          </Alert>
        </>
      )}
    </Container>
  );
}
