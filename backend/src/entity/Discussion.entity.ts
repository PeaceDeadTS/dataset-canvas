import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Dataset } from './Dataset.entity';
import { User } from './User.entity';
import { DiscussionPost } from './DiscussionPost.entity';

@Entity('discussions')
export class Discussion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ManyToOne(() => Dataset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  @Column({ name: 'dataset_id' })
  datasetId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: number;

  @OneToMany(() => DiscussionPost, (post) => post.discussion, { cascade: true })
  posts: DiscussionPost[];

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed fields for display
  postCount?: number;
  lastPostAt?: Date;
  lastPostAuthor?: User;
}

