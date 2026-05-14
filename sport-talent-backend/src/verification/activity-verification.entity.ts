import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('activity_verifications')
export class ActivityVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  activity_id: string;

  @Column()
  method: string;

  @Column()
  verification_level: string;

  @Column()
  status: string;
}