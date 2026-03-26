import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Переопределяем handleRequest, чтобы не выбрасывать ошибку, если пользователь не авторизован
  handleRequest(err: any, user: any) {
    // Возвращаем user, даже если он undefined (неавторизованный запрос)
    return user;
  }
}
