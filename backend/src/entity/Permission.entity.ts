import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { User } from './User.entity';

export enum PermissionType {
  EDIT_CAPTION = 'edit_caption',
  // В будущем можно добавить другие права, например:
  // DELETE_DATASET = 'delete_dataset',
  // MODERATE_COMMENTS = 'moderate_comments',
  // etc.
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ 
    unique: true, 
    type: 'varchar',
    length: 100 
  })
  name!: PermissionType;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToMany(() => User, (user) => user.permissions)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

