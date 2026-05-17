import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CreateUserRequest } from './dto/create-user.request';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CreateUserRequest): Promise<Partial<User>> {
    try {
      return await this.prismaService.user.create({
        data: {
          ...data,
          password: await bcrypt.hash(data.password, 10),
        },
        // Exclude password from the returned user object
        select: {
          id: true,
          email: true,
        },
      });
    } catch (error) {
      console.log(error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException('Email already exists');
      }
      throw error;
    }
  }

  async getUser(filter: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prismaService.user.findUniqueOrThrow({
      where: filter,
    });
  }
}
