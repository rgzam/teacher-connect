import { shouldSendReminder } from './should-remind';

describe('shouldSendReminder', () => {
  const now = new Date('2026-08-20T20:00:00.000Z');

  it('sends when the meeting starts in the next hour and no reminder went out', () => {
    expect(
      shouldSendReminder(new Date('2026-08-20T20:45:00.000Z'), now, null),
    ).toBe(true);
  });

  it('does not send twice', () => {
    expect(
      shouldSendReminder(
        new Date('2026-08-20T20:45:00.000Z'),
        now,
        new Date('2026-08-20T19:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('does not send after the meeting has started', () => {
    expect(
      shouldSendReminder(new Date('2026-08-20T19:50:00.000Z'), now, null),
    ).toBe(false);
  });
});
