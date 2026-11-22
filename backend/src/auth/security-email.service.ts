import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class SecurityEmailService {
  assertConfigured() {
    if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)
      throw new ServiceUnavailableException(
        'Password recovery is temporarily unavailable. Please try again later.',
      );
  }

  async send(to: string, resetUrl?: string) {
    this.assertConfigured();
    const text = resetUrl
      ? `Reset your PlayVerified password\n\nOpen this link within 30 minutes:\n${resetUrl}\n\nThis link can only be used once. Changing your password signs you out of existing sessions. If you did not request this, ignore this email.`
      : 'Your PlayVerified account uses Google sign-in. Choose “Sign in with Google” on PlayVerified. Your Google password is managed by Google. If you did not request this reminder, ignore this email.';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM,
        to: [to],
        subject: 'Your PlayVerified sign-in request',
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // Never include the provider response, reset URL or recipient in logs/errors.
    if (!response.ok) throw new Error('Security email delivery failed');
  }
}
