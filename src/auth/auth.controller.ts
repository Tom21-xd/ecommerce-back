import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUsersDto } from './dto/register-user.dto';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate user token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully validated the user token.',
    schema: {
      example: {
        status: 'Ok!',
        message: 'Success',
        user: {
          id: 'user-id',
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User token is invalid or expired.',
    schema: {
      example: {
        status: 'Error',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async validateSession(@Req() req: Request, @Res() response: Response) {
    try {
      const user = req.user as any;
      const userId = user.id;

      const userSession = await this.authService.validateSession(userId);
      console.log('usersession executed', userSession);
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'Success',
        user: userSession,
      });
    } catch (err) {
      console.error('Validation error:', err);
      const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err.response?.message || err.message || 'Error al validar sesión';
      response.statusMessage = message;
      return response.status(status).json({
        status: 'Error',
        message: message,
      });
    }
  }

  @Post('/login')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'login user' })
  @ApiBody({
    description: 'User login credentials',
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Example of a login request',
        value: {
          email: 'user@example.com',
          password: 'securepassword',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in the user.',
    schema: {
      example: {
        status: 'Ok!',
        message: 'Success',
        result: {
          token: 'jwt-token',
          user: {
            id: 'user-id',
            name: 'John Doe',
            email: 'johndoe@example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials provided.',
    schema: {
      example: {
        status: 'Error',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for the provided input.',
    schema: {
      example: {
        status: 'Error',
        message: 'Validation failed',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async login(
    @Req() req: Request,
    @Res() response: Response,
    @Body() userData: LoginDto,
  ) {
    try {
      const data = await this.authService.login(userData);
      console.log(data);
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'Success',
        result: {
          token: data.token,
          user: data.user,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err.response?.message || err.message || 'Error al iniciar sesión';
      response.statusMessage = message;
      return response.status(status).json({
        status: 'Error',
        message: message,
      });
    }
  }

  @Post('/register')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({
    description: 'User registration credentials',
    type: RegisterUsersDto,
    examples: {
      example1: {
        summary: 'Example of a registration request',
        value: {
          username: 'newuser',
          password: 'securepassword',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully registered the user.',
    schema: {
      example: {
        status: 'Ok!',
        message: 'Successfully registered user!',
        result: {
          token: 'jwt-token',
          user: {
            id: 'user-id',
            name: 'John Doe',
            email: 'johndoe@example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for the provided input.',
    schema: {
      example: {
        status: 'Error',
        message: 'Validation failed',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists.',
    schema: {
      example: {
        status: 'Error',
        message: 'User already exists',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An unexpected error occurred.',
    schema: {
      example: {
        status: 'Error',
        message: 'An unexpected error occurred.',
      },
    },
  })
  async register(
    @Req() request: Request,
    @Res() response: Response,
    @Body() registerDto: RegisterUsersDto,
  ): Promise<any> {
    try {
      const data = await this.authService.register(registerDto);
      return response.status(HttpStatus.CREATED).json({
        status: 'Ok!',
        message: 'Successfully register user!',
        result: {
          token: data.token,
          user: data.user,
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err.response?.message || err.message || 'Error al registrar la cuenta';
      response.statusMessage = message;
      return response.status(status).json({
        status: 'Error',
        message: message,
      });
    }
  }
}
