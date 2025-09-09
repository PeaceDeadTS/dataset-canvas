import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Dataset } from './Dataset.entity';

export enum UserRole {
  ADMIN = 'Administrator',
  DEVELOPER = 'Developer',
  USER = 'User',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => Dataset, (dataset) => dataset.user)
  datasets!: Dataset[];

  @Column({ unique: true, type: 'varchar' })
  username!: string;

  @Column({ unique: true, type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ default: UserRole.USER })
  role!: UserRole;

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
