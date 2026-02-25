import EnvironmentConfigModel from "../models/parameters/environmentConfig.model";

export const getEnvironmentConfigValue = async <T = unknown>(
  key: string
): Promise<T | null> => {
  const config = await EnvironmentConfigModel.findOne({ key }).lean();
  return (config?.value as T) ?? null;
};
