import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { DatasetImage } from './DatasetImage';

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
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: 'varchar' })
  userId: string;

  @OneToMany(() => DatasetImage, (image) => image.dataset, { onDelete: 'CASCADE' })
  images: DatasetImage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
