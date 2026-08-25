import { nextContactStatus } from './contacts.service';

describe('nextContactStatus', () => {
  it('marks the task completed when the teacher says the work is done', () => {
    expect(
      nextContactStatus({
        method: 'PHONE',
        outcome: 'REACHED',
        complete: true,
      }),
    ).toBe('COMPLETED');
  });

  it('moves to follow-up required when a follow-up date is set', () => {
    expect(
      nextContactStatus({
        method: 'PHONE',
        outcome: 'REACHED',
        followUpDate: '2026-08-22',
      }),
    ).toBe('FOLLOW_UP_REQUIRED');
  });

  it('stays at attempted after a voicemail', () => {
    expect(
      nextContactStatus({
        method: 'PHONE',
        outcome: 'LEFT_VOICEMAIL',
      }),
    ).toBe('ATTEMPTED');
  });
});
