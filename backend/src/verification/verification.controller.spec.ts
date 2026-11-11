import {VerificationController} from './verification.controller';
import {GUARDS_METADATA} from '@nestjs/common/constants';import {JwtAuthGuard} from '../auth/jwt-auth.guard';
describe('legacy verification',()=>{it('requires sign-in and refuses unbound verification',()=>{expect(Reflect.getMetadata(GUARDS_METADATA,VerificationController)).toContain(JwtAuthGuard);expect(()=>new VerificationController().retired()).toThrow('Use team session attendance');});});
