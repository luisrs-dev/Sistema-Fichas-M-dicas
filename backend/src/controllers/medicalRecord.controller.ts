import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { allMedicalRecords, insertMedicalRecord, allMedicalRecordsUser, getRecordsByMonthAndYear } from "../services/medicalRecord.service";
import { allServices } from "../services/service.service";

const getAllMedicalRecordsByUser = async ({ params }: Request, res: Response) => {
  try {
    const { _id } = params;
    console.log({ id: _id });

    const responseItems = await allMedicalRecordsUser(_id);
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const responseItems = await allMedicalRecords();
    res.send(responseItems);
  } catch (error) {
    handleHttp(res, "ERROR_GET_ITEMS", error);
  }
};

const postMedicalRecord = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await insertMedicalRecord(body);

    res.send(responseUser);
  } catch (error) {
    handleHttp(res, "ERROR_POST_ITEM", error);
  }
};

const medicalRecordsByMonth = async ({ params }: Request, res: Response) => {
  const { month, year } = params;
  try {
    const medicalRecords = await getRecordsByMonthAndYear(Number(month), Number(year));
    res.status(200).json({
      status: true,
      message: "Fichas clínicas recuperadas",
      medicalRecords
    }); // Respuesta exitosa
  } catch (error) {
    handleHttp(res, "Error fetching medical records by month", error);
  }
};

export { postMedicalRecord, getMedicalRecords, getAllMedicalRecordsByUser, medicalRecordsByMonth };