import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { DiscussionPost } from './DiscussionPost.entity';
import { User } from './User.entity';

@Entity('discussion_edit_history')
export class DiscussionEditHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DiscussionPost, (post) => post.editHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post!: DiscussionPost;

  @Column({ name: 'post_id' })
  postId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'editor_id' })
  editor!: User;

  @Column({ name: 'editor_id', type: 'uuid' })
  editorId!: string;

  @Column({ name: 'old_content', type: 'text' })
  oldContent!: string;

  @Column({ name: 'new_content', type: 'text' })
  newContent!: string;

  @CreateDateColumn({ name: 'edited_at' })
  editedAt!: Date;
}

