import mongoose from 'mongoose';
import { config } from './app.config';

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }
};

export default connectDatabase;
