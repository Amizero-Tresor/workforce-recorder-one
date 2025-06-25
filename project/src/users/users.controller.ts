import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: Role,
  ) {
    return this.usersService.findAll(currentUser, paginationDto, role);
  }

  @Get('export')
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Export users to CSV or Excel' })
  @ApiResponse({ 
    status: 200, 
    description: 'File exported successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the exported file',
        schema: { type: 'string' }
      },
      'Content-Disposition': {
        description: 'Attachment filename',
        schema: { type: 'string' }
      }
    }
  })
  async exportUsers(
    @GetCurrentUser() currentUser: CurrentUser,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Query('role') role: Role | undefined,
    @Res() res: Response,
  ) {
    return this.usersService.exportUsers(currentUser, format, role, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Create new user and send invitation email' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @GetCurrentUser() currentUser: CurrentUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(currentUser, createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(currentUser, id, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(Role.COMPANY_ADMIN, Role.CORPORATE_ADMIN)
  @ApiOperation({ summary: 'Update user status (activate/deactivate)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @GetCurrentUser() currentUser: CurrentUser,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(currentUser, id, updateStatusDto.status);
  }
}