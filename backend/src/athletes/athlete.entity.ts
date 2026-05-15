import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('athlete_profiles')
export class Athlete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;
}