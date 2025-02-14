import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { Request } from 'express';
import { config } from './app.config';
import { NotFoundException } from '../utils/appError';
import { ProviderEnum } from '../enums/account-provider.enum';
import {
  findUserById,
  loginOrCreateAccountService,
  verifyUserService,
} from '../services/auth.service';
import { signJwtToken } from '../utils/jwt';
import { StrategyOptions, ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';

// TODO: Complete Google OAuth setup - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req: Request, _accessToken, _refreshToken, profile, done) => {
        try {
          const { email, sub: googleId, picture } = profile._json;

          if (!googleId) {
            throw new NotFoundException('Google ID (sub) is missing');
          }

          const { user } = await loginOrCreateAccountService({
            provider: ProviderEnum.GOOGLE,
            displayName: profile.displayName,
            providerId: googleId,
            picture,
            email,
          });

          req.jwt = signJwtToken({ userId: user._id });
          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
    },
    async (email, password, done) => {
      try {
        const user = await verifyUserService({ email, password });
        return done(null, user);
      } catch (error: any) {
        return done(error, false, { message: error?.message });
      }
    }
  )
);

interface JwtPayload {
  userId: string;
}

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
  audience: ['user'],
  algorithms: ['HS256'],
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      const user = await findUserById(payload.userId);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (error) {
      return done(null, false);
    }
  })
);

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export const passportAuthenticationJWT = passport.authenticate('jwt', { session: false });
