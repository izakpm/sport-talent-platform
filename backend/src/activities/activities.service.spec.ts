import {activityInput,note} from './activity.validation';
import {ActivitiesService} from './activities.service';
const valid={title:'Gym',sport_id:'rugby',training_kind:'Gym / strength',date:'2025-06-01',time:'16:00',duration_minutes:60,effort:7};
describe('training logs',()=>{
 it('accepts completed sessions and trims details',()=>expect(activityInput({...valid,title:' Gym ',description:' Squats '})).toMatchObject({title:'Gym',description:'Squats',duration:60,start:'2025-06-01 16:00'}));
 it.each([{athlete_id:'other'},{verified:true},{coach_id:'other'},{date:'2025-02-30'},{date:'2099-01-01'},{time:'24:00'},{duration_minutes:0},{duration_minutes:1441},{duration_minutes:1.5},{effort:11},{effort:0},{training_kind:'Unknown'},{title:''}])('rejects invalid or privileged input %j',patch=>expect(()=>activityInput({...valid,...patch})).toThrow());
 it('checks completion rather than only the session start',()=>{const date=new Date(Date.now()-60000+7200000).toISOString();expect(()=>activityInput({...valid,date:date.slice(0,10),time:date.slice(11,16),duration_minutes:120})).toThrow(/finished/);});
 it('limits notes',()=>expect(()=>note('x'.repeat(1001))).toThrow());
 it('locks pending and verified logs',()=>{const service=new ActivitiesService({} as any);expect(()=>service.editable({status:'pending'})).toThrow(/Withdraw/);expect(()=>service.editable({status:'verified'})).toThrow(/locked/);expect(()=>service.editable({legacy_verified:true})).toThrow(/locked/);expect(()=>service.editable({status:'declined'})).not.toThrow();});
});
