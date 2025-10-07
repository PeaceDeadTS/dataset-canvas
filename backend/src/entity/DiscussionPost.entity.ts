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
import { Discussion } from './Discussion.entity';
import { User } from './User.entity';
import { DiscussionEditHistory } from './DiscussionEditHistory.entity';

@Entity('discussion_posts')
export class DiscussionPost {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Discussion, (discussion) => discussion.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Discussion;

  @Column({ name: 'discussion_id' })
  discussionId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: number;

  @Column({ type: 'text' })
  content: string;

  // For replies - can be null if it's a top-level post
  @ManyToOne(() => DiscussionPost, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: DiscussionPost | null;

  @Column({ name: 'reply_to_id', nullable: true })
  replyToId: number | null;

  @OneToMany(() => DiscussionEditHistory, (history) => history.post)
  editHistory: DiscussionEditHistory[];

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by_id', nullable: true })
  deletedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by_id' })
  deletedBy: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed field for edit count
  editCount?: number;
}

