import { DataSourceOptions } from 'typeorm';
import { User } from './entity/User';
import { Dataset } from './entity/Dataset';
import { DatasetImage } from './entity/DatasetImage';
import * as dotenv from 'dotenv';

dotenv.config();

const baseConfig = {
// ... existing code ...
