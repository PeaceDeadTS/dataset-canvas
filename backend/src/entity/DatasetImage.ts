import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Dataset } from "./Dataset";

@Entity()
export class DatasetImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid", generated: "uuid" })
  img_key: string;

  @Column()
  row_number: number;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column("text")
  prompt: string;

  @ManyToOne(() => Dataset, (dataset) => dataset.images)
  dataset: Dataset;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
