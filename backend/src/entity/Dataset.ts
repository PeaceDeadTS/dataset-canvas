import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { DatasetImage } from './DatasetImage';

@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: true })
  isPublic!: boolean;

  @ManyToOne(() => User, (user) => user.datasets)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => DatasetImage, (image) => image.dataset, { onDelete: 'CASCADE' })
  images: DatasetImage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
