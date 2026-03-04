import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma';
import { env } from './env';

passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_CALLBACK_URL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error('No email from Google'), undefined);

                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: profile.displayName,
                            avatar: profile.photos?.[0]?.value ?? null,
                            googleId: profile.id,
                            role: 'CUSTOMER',
                            password: null,
                        },
                    });
                } else if (!user.googleId) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { googleId: profile.id, avatar: user.avatar ?? profile.photos?.[0]?.value },
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err as Error, undefined);
            }
        }
    )
);

export { passport };
