import {rememberCheckIn,pendingCheckIn,checkInReturn,clearCheckIn} from './check-in-return';
beforeEach(()=>sessionStorage.clear());
it('preserves a check-in through sign-in and clears it afterwards',()=>{rememberCheckIn('a'.repeat(43));expect(checkInReturn()).toBe('/check-in#code='+'a'.repeat(43));clearCheckIn();expect(pendingCheckIn()).toBe('');});
it('rejects arbitrary redirect URLs and stale tokens',()=>{rememberCheckIn('https://evil.example');expect(checkInReturn()).toBeNull();sessionStorage.setItem('playverified-check-in',JSON.stringify({code:'a'.repeat(43),at:Date.now()-31*60000}));expect(checkInReturn()).toBeNull();});
