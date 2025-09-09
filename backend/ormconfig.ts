import { ConnectionOptions } from 'typeorm';
import { User } from './src/entity/User';
import { Dataset } from './src/entity/Dataset';
import { DatasetImage } from './src/entity/DatasetImage';
import * as dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const config: ConnectionOptions = {
    type: "mariadb",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: isTest 
        ? process.env.TEST_DB_NAME || "dataset_canvas_test" 
        : process.env.DB_NAME || "dataset_canvas",
    synchronize: true,
    logging: false,
    entities: [
        User,
        Dataset,
        DatasetImage
    ],
    migrations: [
        "src/migration/**/*.ts"
    ],
    subscribers: [
        "src/subscriber/**/*.ts"
    ],
    cli: {
        "entitiesDir": "src/entity",
        "migrationsDir": "src/migration",
        "subscribersDir": "src/subscriber"
    }
};

export = config;
