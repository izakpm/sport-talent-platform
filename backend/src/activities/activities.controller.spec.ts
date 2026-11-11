import {ActivitiesController} from './activities.controller';
import {GUARDS_METADATA} from '@nestjs/common/constants';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
describe('activities access',()=>{
 it('requires sign-in for all routes',()=>expect(Reflect.getMetadata(GUARDS_METADATA,ActivitiesController)).toContain(JwtAuthGuard));
 it('gets the owner from the authenticated request',()=>{const service={findAll:jest.fn(),save:jest.fn(),request:jest.fn(),decide:jest.fn()};const controller=new ActivitiesController(service as any);const req={user:{userId:'signed-in'}};controller.list(req);controller.create(req,{title:'Gym'});controller.request(req,'activity',{coach_id:'coach'});controller.decide(req,'activity',{status:'verified'});expect(service.findAll).toHaveBeenCalledWith('signed-in');expect(service.save).toHaveBeenCalledWith('signed-in',{title:'Gym'});expect(service.request).toHaveBeenCalledWith('signed-in','activity',{coach_id:'coach'});expect(service.decide).toHaveBeenCalledWith('signed-in','activity',{status:'verified'});});
});
