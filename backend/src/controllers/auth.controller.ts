import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { config } from '../config/app.config';
import { registerSchema } from '../validation/auth.validation';
import { HTTPSTATUS } from '../config/http.config';
import { registerUserService } from '../services/auth.service';
import passport from 'passport';
import { signJwtToken } from '../utils/jwt';

// TODO: Complete Google OAuth callback - requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
export const googleLoginCallback = asyncHandler(async (req: Request, res: Response) => {
  const jwt = req.jwt;
  const currentWorkspace = req.user?.currentWorkspace;

  if (!jwt) {
    return res.redirect(`${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`);
  }

  return res.redirect(
    `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=success&access_token=${jwt}&current_workspace=${currentWorkspace}`
  );
});

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({ ...req.body });
    await registerUserService(body);
    return res.status(HTTPSTATUS.CREATED).json({
      message: 'User registered successfully',
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      'local',
      (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
        if (err) return next(err);

        if (!user) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: info?.message || 'Invalid email and password',
          });
        }

        const access_token = signJwtToken({ userId: user._id });

        return res.status(HTTPSTATUS.OK).json({
          message: 'Logged in successfully',
          access_token,
          user,
        });
      }
    )(req, res, next);
  }
);

// TODO: Implement proper JWT-based logout (e.g., token blacklist or short-lived tokens)
export const logOutController = asyncHandler(async (req: Request, res: Response) => {
  return res.status(HTTPSTATUS.OK).json({
    message: 'Logged out successfully',
  });
});

