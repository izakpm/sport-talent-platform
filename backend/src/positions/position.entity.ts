import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  sport_id: string;
}