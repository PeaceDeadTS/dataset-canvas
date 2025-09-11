import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User.entity';
import { DatasetImage } from './DatasetImage.entity';
import { DatasetFile } from './DatasetFile.entity';

@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isPublic!: boolean;

  @ManyToOne(() => User, (user) => user.datasets)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @OneToMany(() => DatasetImage, (image) => image.dataset, { 
    cascade: true,
  })
  images!: DatasetImage[];

  @OneToMany(() => DatasetFile, (file) => file.dataset, { 
    cascade: true,
  })
  files!: DatasetFile[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Транзиентное поле для подсчета изображений
  imageCount?: number;
}
