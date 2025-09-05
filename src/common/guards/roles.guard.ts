import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permite el acceso
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Suponiendo que el usuario se establece en la solicitud por el guardia JWT

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have the necessary permissions to access this resource.',
      );
    }
    return true;
  }
}
