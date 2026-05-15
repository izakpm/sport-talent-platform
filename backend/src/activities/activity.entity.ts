import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  athlete_id: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  title: string;
}