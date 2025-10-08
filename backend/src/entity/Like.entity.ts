import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User.entity';
import { Dataset } from './Dataset.entity';

@Entity('likes')
@Unique(['userId', 'datasetId']) // Один пользователь может поставить только один лайк на датасет
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 36 })
  datasetId!: string;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'datasetId' })
  dataset!: Dataset;

  @CreateDateColumn()
  createdAt!: Date;
}

