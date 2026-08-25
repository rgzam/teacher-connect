import { parentConfirmationEmail, teacherBookingEmail } from './booking-email';

describe('booking emails', () => {
  const details = {
    teacherName: 'Ly Le',
    typeName: 'Parent Conference',
    whenLabel: 'Thursday, August 20 at 3:30 PM',
    guardianName: 'Elena Rodriguez',
    guardianPhone: '555-0100',
    studentName: 'Maya Rodriguez',
    format: 'VIRTUAL' as const,
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    homeVisitAddress: null,
    manageUrl: 'https://bookwithly.com/manage/test-token',
  };

  it('tells the parent the time, Meet link, and how to change it', () => {
    const email = parentConfirmationEmail(details);

    expect(email.subject).toContain('Confirmed');
    expect(email.text).toContain('Ly Le');
    expect(email.text).toContain('3:30 PM');
    expect(email.text).toContain('meet.google.com');
    expect(email.text).toContain('/manage/test-token');
    expect(email.text).not.toContain('Dentist');
  });

  it('notifies the teacher who booked', () => {
    const email = teacherBookingEmail(details);

    expect(email.subject).toContain('New booking');
    expect(email.text).toContain('Elena Rodriguez');
    expect(email.text).toContain('meet.google.com');
  });
});
