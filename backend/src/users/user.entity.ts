import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'boolean', nullable: true })
  password_login_enabled: boolean | null;

  @Column({ type: 'text', nullable: true })
  google_subject: string | null;

  @Column({ default: 0 })
  session_version: number;

  @Column({ nullable: true })
  status: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  profile_image: string;
}
