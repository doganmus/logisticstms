import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../public-entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'public')
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: string, updateDto: any): Promise<User> {
    await this.usersRepository.update(id, updateDto);
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

