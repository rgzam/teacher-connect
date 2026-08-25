export interface BookingEmailDetails {
  teacherName: string;
  typeName: string;
  whenLabel: string;
  guardianName: string;
  studentName: string | null;
  format: 'VIRTUAL' | 'HOME_VISIT';
  virtualMeetingName: string | null;
  homeVisitAddress: string | null;
}

export function formatAppointmentWhen(
  startsAt: Date,
  timeZone: string,
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(startsAt);
}

export function parentConfirmationEmail(details: BookingEmailDetails) {
  const subject = `Confirmed: ${details.typeName} with ${details.teacherName}`;
  const text = [
    `Hi ${details.guardianName},`,
    '',
    `Your ${details.typeName} with ${details.teacherName} is booked for ${details.whenLabel}.`,
    details.studentName ? `Student: ${details.studentName}` : null,
    details.format === 'VIRTUAL' && details.virtualMeetingName
      ? `Virtual meeting name: ${details.virtualMeetingName}`
      : null,
    details.format === 'HOME_VISIT'
      ? 'This is a home visit. The teacher will come with a coworker.'
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
    '',
    'If you need to change this time, contact the teacher.',
    '',
    'TeacherConnect',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text };
}

export function teacherBookingEmail(details: BookingEmailDetails) {
  const subject = `New booking: ${details.typeName} on ${details.whenLabel}`;
  const text = [
    `${details.guardianName} booked a ${details.typeName} for ${details.whenLabel}.`,
    details.studentName ? `Student: ${details.studentName}` : null,
    details.format === 'HOME_VISIT'
      ? 'Home visit: go with a coworker.'
      : null,
    details.virtualMeetingName
      ? `Virtual meeting name: ${details.virtualMeetingName}`
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
    '',
    'This appointment is also on your TeacherConnect dashboard.',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text };
}

export function parentCancellationEmail(details: BookingEmailDetails) {
  const subject = `Canceled: ${details.typeName} with ${details.teacherName}`;
  const text = [
    `Hi ${details.guardianName},`,
    '',
    `Your ${details.typeName} with ${details.teacherName} on ${details.whenLabel} was canceled.`,
    '',
    'You can book a new time with the teacher’s booking link.',
  ].join('\n');

  return { subject, text };
}

export function reminderEmail(details: BookingEmailDetails, forTeacher: boolean) {
  const subject = `Reminder: ${details.typeName} in about 1 hour`;
  const text = [
    forTeacher
      ? `Reminder: ${details.guardianName} at ${details.whenLabel}.`
      : `Hi ${details.guardianName}, reminder: ${details.typeName} with ${details.teacherName} at ${details.whenLabel}.`,
    details.studentName ? `Student: ${details.studentName}` : null,
    details.format === 'HOME_VISIT'
      ? forTeacher
        ? 'Home visit: bring a coworker.'
        : 'This is a home visit. The teacher will come with a coworker.'
      : null,
    details.virtualMeetingName
      ? `Virtual meeting name: ${details.virtualMeetingName}`
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text };
}
