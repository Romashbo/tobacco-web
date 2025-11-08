import { Client, Databases, Query, Account, ID } from "appwrite";

export const AppwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "69089faf0003f07e18f8",
  databaseId: "6908a04d0019b032bd7d",
  boxCollection: "6908a29e0022b0b1f3bc",
  orderCollection: "690fb356000ca205fc03",
  calCollection: "690fb3390024f9fa3f0e",
  shiftsDatabaseId: "690fb45700324f5c54a6",
  shiftsCollection: "690fb46e0012ce73315a",
};

const client = new Client();
client
  .setEndpoint(AppwriteConfig.endpoint)
  .setProject(AppwriteConfig.projectId);

const databases = new Databases(client);
const account = new Account(client);

export const getTobaccoList = async () => {
  try {
    const tobacco = await databases.listDocuments(
      AppwriteConfig.databaseId,
      AppwriteConfig.boxCollection,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(200), // Укажи нужное число
      ]
    );
    return tobacco.documents;
  } catch (error) {
    console.error("Error fetching tobacco list:", error);
    throw error;
  }
};

export const deleteTobacco = async (id) => {
  try {
    return await databases.deleteDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.boxCollection,
      id
    );
  } catch (error) {
    console.error("Ошибка удаления документа:", error);
    throw error;
  }
};

export const updateTobacco = async (id, data) => {
  try {
    return await databases.updateDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.boxCollection,
      id,
      data
    );
  } catch (error) {
    console.error("Ошибка обновления документа:", error);
    throw error;
  }
};
export const createTobacco = async (data) => {
  try {
    return await databases.createDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.boxCollection,
      "unique()",
      data
    );
  } catch (error) {
    console.error("Ошибка создания табака:", error);
    throw error;
  }
};

export const getOrderTobacco = async () => {
  try {
    const tobacco = await databases.listDocuments(
      AppwriteConfig.databaseId,
      AppwriteConfig.orderCollection,

      [
        Query.orderDesc("$createdAt"),
        Query.limit(300), // Укажи нужное число
      ]
    );
    return tobacco.documents;
  } catch (error) {
    console.error("Error fetching tobacco list:", error);
    throw error;
  }
};

export const deleteOrderTobacco = async (id) => {
  try {
    return await databases.deleteDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.orderCollection,
      id
    );
  } catch (error) {
    console.error("Ошибка удаления документа:", error);
    throw error;
  }
};

export const createOrderTobacco = async (data) => {
  try {
    return await databases.createDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.orderCollection,
      "unique()",
      data
    );
  } catch (error) {
    console.error("Ошибка создания табака:", error);
    throw error;
  }
};
export const getCalTobacco = async () => {
  try {
    const tobacco = await databases.listDocuments(
      AppwriteConfig.databaseId,
      AppwriteConfig.calCollection,
      [Query.orderDesc("$createdAt")]
    );
    return tobacco.documents;
  } catch (error) {
    console.error("Error fetching tobacco list:", error);
    throw error;
  }
};

export const deleteCalTobacco = async (id) => {
  try {
    return await databases.deleteDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.calCollection,
      id
    );
  } catch (error) {
    console.error("Ошибка удаления документа:", error);
    throw error;
  }
};

export const createCalTobacco = async (data) => {
  try {
    return await databases.createDocument(
      AppwriteConfig.databaseId,
      AppwriteConfig.calCollection,
      "unique()",
      data
    );
  } catch (error) {
    console.error("Ошибка создания табака:", error);
    throw error;
  }
};
// --- СМЕНЫ (учёт кальянов по сотруднику) ---

/** Анонимная сессия (если нужна) */
export const ensureSession = async () => {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
};

/** Записать закрытие смены */
export const createShift = async ({
  employeeId,
  employeeName,
  count,
  startedAt, // ISO-строка или Date | number
  endedAt, // ISO-строка или Date | number
}) => {
  await ensureSession();

  const toISO = (v) =>
    typeof v === "string" ? v : new Date(v ?? Date.now()).toISOString();

  const _startedAt = toISO(startedAt);
  const _endedAt = toISO(endedAt);
  const workDate = _startedAt.slice(0, 10); // YYYY-MM-DD

  return await databases.createDocument(
    AppwriteConfig.shiftsDatabaseId,
    AppwriteConfig.shiftsCollection,
    "unique()",
    {
      employeeId,
      employeeName,
      count,
      startedAt: _startedAt,
      endedAt: _endedAt,
      workDate,
    }
  );
};

/** История смен по сотруднику (последние N) */
export const listShiftsByEmployee = async (employeeId, limit = 50) => {
  await ensureSession();
  const res = await databases.listDocuments(
    AppwriteConfig.shiftsDatabaseId,
    AppwriteConfig.shiftsCollection,
    [
      Query.equal("employeeId", employeeId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]
  );
  return res.documents;
};

/** История смен по диапазону дат (YYYY-MM-DD) */
export const listShiftsByDateRange = async (fromYmd, toYmd, limit = 200) => {
  await ensureSession();
  const res = await databases.listDocuments(
    AppwriteConfig.shiftsDatabaseId,
    AppwriteConfig.shiftsCollection,
    [
      Query.greaterThanEqual("workDate", fromYmd),
      Query.lessThanEqual("workDate", toYmd),
      Query.orderDesc("workDate"),
      Query.limit(limit),
    ]
  );
  return res.documents;
};

// Удалить ВСЕ записи (всех сотрудников) из коллекции смен
export const deleteAllShifts = async () => {
  await ensureSession();

  const db = AppwriteConfig.shiftsDatabaseId;
  const coll = AppwriteConfig.shiftsCollection;

  let lastId = null;
  let deleted = 0;

  // Идём порциями по 100 доков, пока не закончатся
  while (true) {
    const queries = [Query.limit(100)];
    if (lastId) queries.push(Query.cursorAfter(lastId));

    const res = await databases.listDocuments(db, coll, queries);
    const docs = res.documents || [];
    if (docs.length === 0) break;

    for (const d of docs) {
      await databases.deleteDocument(db, coll, d.$id);
      deleted++;
    }
    lastId = docs[docs.length - 1].$id;
    if (docs.length < 100) break;
  }

  return { deleted };
};

export { account };
