import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RedisService } from '../../shared/redis/redis.service';
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: true },
            },
          },
        },
        branchAssignments: true,
      },
    });

    if (!user || !user.isActive) return null;

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) return null;

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.resource}:${rp.action}`),
    );
    const branchIds = user.branchAssignments.map((ub) => ub.branchId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions: [...new Set(permissions)],
      branchIds,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'mechanica-refresh-secret'),
      });

      const stored = await this.redis.get(`refresh:${payload.sub}`);
      if (stored !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.redis.del(`refresh:${payload.sub}`);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: {
                include: { permissions: true },
              },
            },
          },
          branchAssignments: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or deactivated');
      }

      const roles = user.roles.map((ur) => ur.role.name);
      const permissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => `${rp.resource}:${rp.action}`),
      );
      const branchIds = user.branchAssignments.map((ub) => ub.branchId);

      return this.generateTokens({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions: [...new Set(permissions)],
        branchIds,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid password');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.newEmail } });
    if (existing) throw new BadRequestException('Email already in use');

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail },
    });

    return { message: 'Email updated successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return { message: 'If the email exists, an OTP has been sent' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${dto.email}`;

    await this.redis.set(key, otp, 600);

    const sent = await this.emailService.sendOtpEmail(dto.email, otp);
    if (!sent) {
      this.logger.warn(`OTP for ${dto.email}: ${otp}`);
    }

    return { message: 'If the email exists, an OTP has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const key = `otp:${dto.email}`;
    const stored = await this.redis.get(key);

    if (!stored || stored !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.redis.del(key);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
    branchIds: string[];
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      permissions: user.permissions,
      branchIds: user.branchIds,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'mechanica-jwt-secret'),
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'mechanica-refresh-secret'),
        expiresIn: '7d',
      },
    );

    await this.redis.set(
      `refresh:${user.id}`,
      refreshToken,
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        permissions: user.permissions,
        branchIds: user.branchIds,
      },
    };
  }
}
