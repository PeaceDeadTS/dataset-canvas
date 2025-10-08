import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User.entity';
import { Dataset } from './Dataset.entity';

@Entity('likes')
@Unique(['userId', 'datasetId']) // One user can only like a dataset once
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  datasetId!: string;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'datasetId' })
  dataset!: Dataset;

  @CreateDateColumn()
  createdAt!: Date;
}

