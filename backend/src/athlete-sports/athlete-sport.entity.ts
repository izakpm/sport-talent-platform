import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('athlete_sports')
export class AthleteSport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  athlete_id: string;

  @Column()
  sport_id: string;

  @Column()
  position_id: string;

  @Column({ default: false })
  is_primary: boolean;
}