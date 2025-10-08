import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Dataset } from "./Dataset.entity";

@Entity()
export class DatasetImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  img_key!: string;

  @Column()
  row_number!: number;

  @Column()
  filename!: string;

  @Column()
  url!: string;

  @Column()
  width!: number;

  @Column()
  height!: number;

  @Column('text')
  prompt!: string;

  // COCO-specific fields
  @Column({ type: 'int', nullable: true })
  cocoImageId?: number;

  @Column({ type: 'json', nullable: true })
  additionalCaptions?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  license?: string;

  @Column({ type: 'text', nullable: true })
  flickrUrl?: string;

  @ManyToOne(() => Dataset, (dataset) => dataset.images, { onDelete: 'CASCADE' })
  dataset!: Dataset;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
