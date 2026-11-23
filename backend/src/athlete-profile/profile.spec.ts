import { detailsInput, entryInput } from './profile.validation';
import { AthleteProfileController } from './profile.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GUARDS_METADATA } from '@nestjs/common/constants';
describe('athlete profile validation', () => {
  it('requires authentication', () =>
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AthleteProfileController),
    ).toContain(JwtAuthGuard));
  it('accepts trimmed details and clearing optional fields', () =>
    expect(
      detailsInput({ first_name: ' Izak ', bio: '', province: 'Gauteng' }),
    ).toEqual({ first_name: 'Izak', bio: '', province: 'Gauteng' }));
  it.each([
    { role: 'COACH' },
    { user_id: 'other' },
    { email: 'other@test.com' },
    { verified: true },
    { first_name: '' },
    { phone: 'abc' },
    { profile_image: 'data:image/svg+xml;base64,AAAA' },
  ])('rejects invalid or privileged updates %j', (body) =>
    expect(() => detailsInput(body)).toThrow(),
  );
  it('assigns units on the server', () =>
    expect(
      entryInput({
        kind: 'metric',
        title: '40 m sprint',
        date: '2025-06-01',
        value: 5.2,
      }),
    ).toMatchObject({ unit: 's', value: 5.2 }));
  it.each([
    { value: -1 },
    { value: Infinity },
    { value: '80' },
    { date: '2025-02-30' },
    { date: '2099-01-01' },
    { verified: true },
    { unit: 'lb' },
    { title: 'Unknown' },
  ])('rejects invalid metric %j', (body) =>
    expect(() =>
      entryInput({
        kind: 'metric',
        title: 'Bench press',
        date: '2025-06-01',
        value: 80,
        ...body,
      }),
    ).toThrow(),
  );
  it('keeps achievements distinct from measured results', () =>
    expect(
      entryInput({
        kind: 'achievement',
        title: 'Academy team',
        date: '2025-06-01',
      }),
    ).toMatchObject({ value: null, unit: null }));
});

const selection = {
  kind: 'achievement',
  title: 'U15 team',
  date: '2025-06-01',
  achievement_type: 'team_selection',
  leadership_role: 'Captain',
  leadership_date: '2025-06-02',
};
it('keeps selection and appointment dates separate', () =>
  expect(entryInput(selection)).toMatchObject({
    date: '2025-06-01',
    leadership_date: '2025-06-02',
    leadership_role: 'Captain',
  }));
it('allows an unknown appointment date without inventing one', () =>
  expect(entryInput({ ...selection, leadership_date: '' })).toMatchObject({
    leadership_date: null,
  }));
it.each([
  { leadership_date: '2025-05-31' },
  { leadership_date: '2025-02-30' },
  { leadership_date: '2099-01-01' },
  { leadership_role: '' },
  { achievement_type: 'general' },
  { leadership_role: 'Admin' },
  { kind: 'metric', title: 'Bench press', value: 80 },
])('rejects inconsistent selection fields %j', (fields) =>
  expect(() => entryInput({ ...selection, ...fields })).toThrow(),
);

it('accepts a directory reference only for achievements', () => {
  const id = 'b8213c7d-6111-4761-9d70-dfbb4af03a89';
  expect(entryInput({ ...selection, organisation_id: id })).toMatchObject({
    organisation_id: id,
  });
  expect(() =>
    entryInput({ ...selection, organisation_id: 'not-an-id' }),
  ).toThrow();
  expect(() =>
    entryInput({
      kind: 'metric',
      title: 'Bench press',
      date: '2025-06-01',
      value: 80,
      organisation_id: id,
    }),
  ).toThrow();
});
