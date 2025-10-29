import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Supplier } from '../suppliers/supplier.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plateNumber: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column('int')
  year: number;

  @Column('int')
  capacityKg: number;

  @Column({ default: false })
  isExternal: boolean;

  @ManyToOne(() => Supplier, supplier => supplier.vehicles)
  supplier: Supplier;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
