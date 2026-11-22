import {
  Controller,
  Delete,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

// Internal service-to-service endpoints shared with the School Portal backend.
// These are NOT public — every call must present the shared INTERNAL_SYNC_KEY
// header configured on both services.
@Controller('internal')
export class InternalController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private assertKey(key?: string) {
    const expected = this.configService.get<string>('INTERNAL_SYNC_KEY');
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Invalid internal key');
    }
  }

  // Called by School Portal when a school is deleted there — removes the
  // linked fees owner (and their schools) so both platforms stay in sync.
  @Delete('school-owners/:ownerId')
  deleteOwner(
    @Param('ownerId') ownerId: string,
    @Headers('x-internal-key') key: string,
  ) {
    this.assertKey(key);
    return this.authService.deleteSchoolOwner(+ownerId, true);
  }
}
