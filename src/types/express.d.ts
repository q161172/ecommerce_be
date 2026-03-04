// Augment Express's global types to add req.user to all controllers
// This avoids the need for AuthRequest extends Request everywhere

declare global {
    namespace Express {
        // Passport uses Express.User for req.user — extend it here
        interface User {
            id: string;
            email: string;
            role: string;
        }

        // Also declare on Request directly for non-Passport usage
        interface Request {
            user?: User;
        }
    }
}

export { };
