import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sports')
export class Sport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}