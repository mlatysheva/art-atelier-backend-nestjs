import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './token-payload.interface';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  login(user: User, response: Response) {
    // Calculate the expiration time for the JWT according to the JWT_EXPIRATION environment variable
    const jwtExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '10h';
    const expirationMs = ms(jwtExpiration as unknown as ms.StringValue);
    const expires = new Date(Date.now() + expirationMs);

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };
    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      // `secure` should be set to true in production, in development it is set to false to allow Postman requests
      secure: this.configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      expires,
    });

    return { tokenPayload };
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.getUser({ email });
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException('Credentials are not valid.');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException(
        'Credentials are not valid. ',
        getErrorMessage(error),
      );
    }
  }

  verifyToken(jwt: string) {
    this.jwtService.verify(jwt);
  }
}
