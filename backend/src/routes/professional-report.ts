import { Router } from 'express';
import { Types } from 'mongoose';
import { verifyToken } from '../utils/jwt.handle';
import UserModel from '../models/user.model';
import MedicalRecordModel from '../models/medicalRecord.model';
import PatientModel from '../models/patient.model';
import ServiceModel from '../models/parameters/service.model';

const router = Router();

// Resolve permissions from the database, never from client-supplied user IDs.
router.use(async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token?.startsWith('Bearer ')) return res.status(401).json({ message: 'Autenticación requerida' });
    const decoded = verifyToken(token.slice(7));
    if (typeof decoded === 'string') return res.status(401).json({ message: 'Token inválido' });
    const email = decoded.email || decoded.emailLowercase;
    if (!email) return res.status(401).json({ message: 'Token inválido' });
    const user = await UserModel.findOne({ email: String(email).toLowerCase() }).populate('permissions').lean();
    if (!user || user.active === false) return res.status(403).json({ message: 'Acceso no autorizado' });
    res.locals.reportUser = user;
    res.locals.reportAdmin = (user.permissions as any[]).some(p => p?.value === 'admin');
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

router.get('/professionals', async (_req, res) => {
  try {
    const filter = res.locals.reportAdmin ? {} : { _id: res.locals.reportUser._id };
    const professionals = await UserModel.find(filter).select('name active').sort({ name: 1 }).lean();
    res.json({ professionals });
  } catch {
    res.status(500).json({ message: 'No se pudieron cargar los profesionales' });
  }
});

router.get('/', async (req, res) => {
  const { professionalId, month, year, page = '0', pageSize = '10', search = '', order = 'desc', exportAll } = req.query;
  const m = Number(month), y = Number(year), p = Number(page), size = Number(pageSize);
  if (typeof professionalId !== 'string' || !/^[a-f\d]{24}$/i.test(professionalId)
    || !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 1900 || y > 9999
    || !Number.isInteger(p) || p < 0 || p > 1000000 || ![10, 25, 50].includes(size)
    || (exportAll !== undefined && exportAll !== 'true')
    || typeof search !== 'string' || search.length > 100 || !['asc', 'desc'].includes(String(order))) {
    return res.status(400).json({ message: 'Filtros inválidos' });
  }
  if (!res.locals.reportAdmin && String(res.locals.reportUser._id) !== professionalId) {
    return res.status(403).json({ message: 'Solo puedes consultar tus propias prestaciones' });
  }
  try {
    const period = `${y}-${String(m).padStart(2, '0')}`;
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pipeline: any[] = [
      { $match: { registeredBy: new Types.ObjectId(professionalId) } },
      { $set: { attentionDate: { $convert: { input: '$date', to: 'date', onError: null, onNull: null } } } },
      { $match: { $expr: { $eq: [{ $dateToString: { date: '$attentionDate', format: '%Y-%m', timezone: 'America/Santiago', onNull: '' } }, period] } } },
      { $lookup: { from: PatientModel.collection.name, localField: 'patient', foreignField: '_id', as: 'patientInfo' } },
      { $lookup: { from: ServiceModel.collection.name, localField: 'service', foreignField: '_id', as: 'serviceInfo' } },
      { $set: { patientInfo: { $arrayElemAt: ['$patientInfo', 0] }, serviceInfo: { $arrayElemAt: ['$serviceInfo', 0] } } },
      { $set: { patientName: { $trim: { input: { $concat: [{ $ifNull: ['$patientInfo.name', ''] }, ' ', { $ifNull: ['$patientInfo.surname', ''] }, ' ', { $ifNull: ['$patientInfo.secondSurname', ''] }] } } } } },
    ];
    if (escapedSearch) pipeline.push({ $match: { $or: [{ patientName: { $regex: escapedSearch, $options: 'i' } }, { 'patientInfo.rut': { $regex: escapedSearch, $options: 'i' } }] } });
    pipeline.push({ $facet: {
      summary: [{ $group: { _id: null, total: { $sum: 1 }, patients: { $addToSet: '$patient' } } }, { $project: { _id: 0, total: 1, patients: { $size: '$patients' } } }],
      services: [{ $group: { _id: '$service', description: { $first: '$serviceInfo.description' }, code: { $first: '$serviceInfo.code' }, total: { $sum: 1 } } }, { $sort: { total: -1, _id: 1 } }],
      records: [{ $sort: { attentionDate: order === 'asc' ? 1 : -1, _id: 1 } }, ...(exportAll === 'true' ? [] : [{ $skip: p * size }, { $limit: size }]), { $project: {
        _id: 1, date: { $dateToString: { date: '$attentionDate', format: '%d/%m/%Y', timezone: 'America/Santiago' } }, duration: 1,
        patientId: '$patientInfo._id', patientName: 1, rut: '$patientInfo.rut', service: '$serviceInfo.description', serviceCode: '$serviceInfo.code'
      } }]
    } });
    const [result] = await MedicalRecordModel.aggregate(pipeline);
    res.json({ records: result.records, summary: result.summary[0] || { total: 0, patients: 0 }, services: result.services });
  } catch {
    res.status(500).json({ message: 'No se pudieron consultar las prestaciones' });
  }
});

export { router };
