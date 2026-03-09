import { SystemStatus } from "../interfaces/systemStatus.interface";
import SystemStatusModel from "../models/systemStatus.model";

let legacyIndexCleanupPromise: Promise<void> | null = null;

const ensureLegacyKeyIndexRemoved = async () => {
  legacyIndexCleanupPromise ??= (async () => {
      try {
        const indexes = await SystemStatusModel.collection.indexes();
        const legacyIndex = indexes.find(
          (index) => index.name === "key_1" || index.key?.key === 1
        );

        if (!legacyIndex) {
          return;
        }

        await SystemStatusModel.collection.dropIndex(legacyIndex.name);
        console.log(`[systemStatus] Índice legado eliminado: ${legacyIndex.name}`);
      } catch (error: any) {
        const message = error?.message || "";
        const codeName = error?.codeName || "";

        if (
          codeName === "NamespaceNotFound" ||
          codeName === "IndexNotFound" ||
          message.includes("ns not found") ||
          message.includes("index not found")
        ) {
          return;
        }

        throw error;
      }
    })().catch((error) => {
      legacyIndexCleanupPromise = null;
      throw error;
    });

  await legacyIndexCleanupPromise;
};

const getSystemStatus = async () => {
  await ensureLegacyKeyIndexRemoved();

  let response = await SystemStatusModel.findOne({}).sort({ createdAt: -1 });

  if (!response) {
    response = await SystemStatusModel.create({
      action: "open",
      isOpen: true,
      note: "",
      updatedByName: "Sistema",
    });
  }

  return response;
};

const getSystemStatusHistory = async () => {
  await ensureLegacyKeyIndexRemoved();

  const response = await SystemStatusModel.find({})
    .sort({ createdAt: -1 })
    .limit(8);

  return response;
};

const updateSystemStatus = async (status: SystemStatus) => {
  await ensureLegacyKeyIndexRemoved();

  const payload: SystemStatus = {
    action: status.isOpen ? "open" : "close",
    isOpen: status.isOpen,
    note: status.note || "",
    updatedByName: status.updatedByName || "",
    updatedByUserId: status.updatedByUserId || undefined,
  };

  const response = await SystemStatusModel.create(payload);

  return response;
};

export { getSystemStatus, getSystemStatusHistory, updateSystemStatus };