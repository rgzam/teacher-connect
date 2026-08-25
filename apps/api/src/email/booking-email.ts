export interface BookingEmailDetails {
  teacherName: string;
  typeName: string;
  whenLabel: string;
  guardianName: string;
  guardianPhone: string | null;
  studentName: string | null;
  format: 'VIRTUAL' | 'HOME_VISIT';
  meetUrl: string | null;
  homeVisitAddress: string | null;
  manageUrl: string | null;
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
    details.format === 'VIRTUAL' && details.meetUrl
      ? `Google Meet: ${details.meetUrl}`
      : null,
    details.format === 'VIRTUAL' && !details.meetUrl
      ? 'This is a video meeting. The teacher will share a Google Meet link.'
      : null,
    details.format === 'HOME_VISIT'
      ? 'This is a home visit. The teacher will come with a coworker.'
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
    details.manageUrl
      ? `Need to cancel or pick a new time? ${details.manageUrl}`
      : null,
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
    details.guardianPhone ? `Parent phone: ${details.guardianPhone}` : null,
    details.format === 'HOME_VISIT'
      ? 'Home visit: go with a coworker.'
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
    details.format === 'VIRTUAL' && details.meetUrl
      ? `Google Meet: ${details.meetUrl}`
      : null,
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

export function teacherCancellationEmail(details: BookingEmailDetails) {
  const subject = `Canceled: ${details.typeName} on ${details.whenLabel}`;
  const text = [
    `${details.guardianName} canceled the ${details.typeName} on ${details.whenLabel}.`,
    details.studentName ? `Student: ${details.studentName}` : null,
    '',
    'That time is open again on your booking page.',
  ]
    .filter(Boolean)
    .join('\n');

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
    details.format === 'VIRTUAL' && details.meetUrl
      ? `Google Meet: ${details.meetUrl}`
      : null,
    details.homeVisitAddress ? `Address: ${details.homeVisitAddress}` : null,
    !forTeacher && details.manageUrl
      ? `Cancel or reschedule: ${details.manageUrl}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text };
}
