import { ConnectionOptions } from 'typeorm';
import { User } from './src/entity/User';
import { Dataset } from './src/entity/Dataset';
import { DatasetImage } from './src/entity/DatasetImage';
import * as dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

// Base connection details, default to TCP/IP
let connectionDetails: Partial<ConnectionOptions> = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
};

// If a socket path is provided in the environment, use it instead
if (process.env.DB_SOCKET_PATH) {
    connectionDetails = {
        socketPath: process.env.DB_SOCKET_PATH,
    };
}

const config: ConnectionOptions = {
    type: "mariadb",
    ...connectionDetails, // Spread the appropriate connection details
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: isTest 
        ? process.env.DB_DATABASE || "dataset_canvas_test" 
        : process.env.DB_DATABASE || "dataset_canvas",
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
