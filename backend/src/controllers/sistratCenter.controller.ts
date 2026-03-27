import { Request, Response } from "express";
import * as SistratCenterService from "../services/sistratCenter.service";

export const createCenter = async (req: Request, res: Response) => {
  try {
    const center = await SistratCenterService.createCenter(req.body);
    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el centro", error });
  }
};

export const getCenters = async (req: Request, res: Response) => {
  try {
    const centers = await SistratCenterService.getCenters();
    res.status(200).json(centers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los centros", error });
  }
};

export const getActiveCenters = async (req: Request, res: Response) => {
  try {
    const centers = await SistratCenterService.getActiveCenters();
    res.status(200).json(centers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los centros activos", error });
  }
};

export const updateCenter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const center = await SistratCenterService.updateCenter(id, req.body);
    if (!center) {
      return res.status(404).json({ message: "Centro no encontrado" });
    }
    res.status(200).json(center);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el centro", error });
  }
};

export const deleteCenter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await SistratCenterService.deleteCenter(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el centro", error });
  }
};
