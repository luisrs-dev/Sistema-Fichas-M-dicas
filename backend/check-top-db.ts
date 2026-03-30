import mongoose from 'mongoose';
import TopFormModel from './src/models/topForm.model';
import 'dotenv/config';

const checkTopDb = async () => {
  await mongoose.connect(process.env.DB_URI || '');
  const forms = await TopFormModel.find().sort({ createdAt: -1 }).limit(1);
  console.log('Last TopForm:', forms[0] ? { 
    id: forms[0]._id, 
    fechaEntrevista: forms[0].fechaEntrevista,
    createdAt: forms[0].createdAt 
  } : 'No forms found');
  await mongoose.disconnect();
};

checkTopDb();
