import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Dataset } from './Dataset.entity';

export enum ActivityType {
  DATASET_CREATED = 'dataset_created',
  FILE_UPLOADED = 'file_uploaded',
}

@Entity('dataset_activity')
export class DatasetActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  datasetId: number;

  @ManyToOne(() => Dataset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'datasetId' })
  dataset: Dataset;

  // Additional metadata for file uploads
  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ type: 'int', nullable: true })
  imageCount?: number;

  @CreateDateColumn()
  createdAt: Date;
}

