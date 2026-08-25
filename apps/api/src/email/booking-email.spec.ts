import { parentConfirmationEmail, teacherBookingEmail } from './booking-email';

describe('booking emails', () => {
  const details = {
    teacherName: 'Ly Le',
    typeName: 'Parent Conference',
    whenLabel: 'Thursday, August 20 at 3:30 PM',
    guardianName: 'Elena Rodriguez',
    studentName: 'Maya Rodriguez',
    format: 'VIRTUAL' as const,
    virtualMeetingName: 'Rodriguez family',
    homeVisitAddress: null,
  };

  it('tells the parent the time and teacher, not Google calendar details', () => {
    const email = parentConfirmationEmail(details);

    expect(email.subject).toContain('Confirmed');
    expect(email.text).toContain('Ly Le');
    expect(email.text).toContain('3:30 PM');
    expect(email.text).not.toContain('Dentist');
  });

  it('notifies the teacher who booked', () => {
    const email = teacherBookingEmail(details);

    expect(email.subject).toContain('New booking');
    expect(email.text).toContain('Elena Rodriguez');
  });
});
