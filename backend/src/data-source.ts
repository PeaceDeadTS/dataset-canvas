import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { connectionConfig } from './ormconfig';

export const AppDataSource = new DataSource(connectionConfig);
