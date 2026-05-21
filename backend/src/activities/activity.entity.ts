import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sport } from '../sports/sport.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  athlete_id: string;

  @Column({ nullable: true })
  sport_id: string;

  @ManyToOne(() => Sport, { nullable: true })
  @JoinColumn({ name: 'sport_id' })
  sport?: Sport;

  @Column({ name: 'activity_type_id', nullable: true })
  activity_type: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date;
}