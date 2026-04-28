import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from '@/config/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: config.google.clientId!,
      clientSecret: config.google.clientSecret!,
      callbackURL: config.google.callbackUrl!,
      scope: ['profile', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, displayName } = profile;
    done(null, {
      email: emails[0].value,
      name: displayName,
    });
  }
}
