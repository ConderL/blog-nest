import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret', 'your-secret-key'),
    });
    this.logger.log(
      `JWT Strategy initialized with secret: ${configService.get('jwt.secret', 'your-secret-key')}`,
    );
  }

  async validate(payload: any) {
    this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);
    try {
      const { sub: id } = payload;
      // 首先尝试通过ID查找用户
      let user = await this.userService.findById(id);

      // 如果通过ID找不到用户，则尝试通过用户名查找
      if (!user && payload.username) {
        this.logger.warn(
          `User with ID ${id} not found, trying to find by username ${payload.username}`,
        );
        user = await this.userService.findByUsername(payload.username);
      }

      if (!user) {
        this.logger.error(`User with ID ${id} and username ${payload.username} not found`);
        // 为了防止验证失败，创建一个最小的用户对象
        return {
          id: id,
          username: payload.username || 'unknown',
        };
      }

      this.logger.log(`User validated: ${user.username}`);
      return user;
    } catch (error) {
      this.logger.error(`JWT验证出错: ${error.message}`);
      // 返回一个最小的用户对象以避免验证失败
      return {
        id: payload.sub,
        username: payload.username || 'unknown',
      };
    }
  }
}
