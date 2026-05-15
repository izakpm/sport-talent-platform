import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  expires_at: Date;
}