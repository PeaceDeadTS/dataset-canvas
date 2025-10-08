import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Dataset } from './Dataset.entity';
import { Permission } from './Permission.entity';

export enum UserRole {
  ADMIN = 'Administrator',
  DEVELOPER = 'Developer',
  USER = 'User',
}

export enum UserTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => Dataset, (dataset) => dataset.user)
  datasets!: Dataset[];

  @ManyToMany(() => Permission, (permission) => permission.users)
  @JoinTable({
    name: 'user_permissions',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  @Column({ unique: true, type: 'varchar' })
  username!: string;

  @Column({ unique: true, type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ default: UserRole.USER })
  role!: UserRole;

  @Column({ 
    type: 'varchar',
    default: UserTheme.SYSTEM,
    length: 20
  })
  theme!: UserTheme;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfPasswordIsValid(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
  }
}
