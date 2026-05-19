import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('athlete_profiles')
export class Athlete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  school_id: string;

  @Column({ nullable: true })
  guardian_id: string;

  @Column({ nullable: true })
  profile_visibility: string;
}