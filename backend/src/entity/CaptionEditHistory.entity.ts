import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { DatasetImage } from './DatasetImage.entity';

@Entity('caption_edit_history')
export class CaptionEditHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DatasetImage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'imageId' })
  image!: DatasetImage;

  @Column()
  imageId!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ nullable: true })
  userId?: string;

  @Column('text')
  oldCaption!: string;

  @Column('text')
  newCaption!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

