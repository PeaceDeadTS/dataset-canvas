import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User.entity';
import { DiscussionPost } from './DiscussionPost.entity';

@Entity('post_likes')
@Unique(['userId', 'postId']) // Один пользователь может поставить только один лайк на пост
export class PostLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('int')
  postId!: number;

  @ManyToOne(() => DiscussionPost)
  @JoinColumn({ name: 'postId' })
  post!: DiscussionPost;

  @CreateDateColumn()
  createdAt!: Date;
}

