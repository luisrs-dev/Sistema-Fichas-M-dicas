import mongoose from 'mongoose';
import SocialDiagnosisFormModel from './src/models/socialDiagnosisForm.model';
import 'dotenv/config';

const checkDb = async () => {
  await mongoose.connect(process.env.DB_URI || '');
  const forms = await SocialDiagnosisFormModel.find().limit(5);
  console.log('Forms found:', forms);
  await mongoose.disconnect();
};

checkDb();
