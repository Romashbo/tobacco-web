import { Client, Databases, Query, Account } from "appwrite";

export const AppwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6820689a00180f71a4e3",
  databaseId: "68206949001f7d23b91b",
  boxCollection: "682069730010de16a48b",
  orderCollection: "68207c88001ad97aa8d5",
  calCollection: "6821bf3a00127d5156d0",
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

export { account };
