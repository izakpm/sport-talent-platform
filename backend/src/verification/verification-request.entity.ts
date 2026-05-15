import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('verification_requests')
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  activity_id: string;

  @Column()
  athlete_id: string;

  @Column()
  coach_id: string;

  @Column()
  status: string; // PENDING, APPROVED, DECLINED
}