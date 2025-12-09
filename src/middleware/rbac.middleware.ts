import { RequestHandler } from 'express';
import { ApiError } from './error.middleware.js';

type Role = 'ADMIN' | 'LAWYER' | 'CLIENT';

/** requireRole(...roles) - middleware factory to enforce user roles */
export function requireRole(...roles: Role[]): RequestHandler {
	return (req, _res, next) => {
		const user = (req as any).user;
		if (!user || !user.role) {
			return next(new ApiError(401, 'Authentication required'));
		}

		if (!roles.includes(user.role)) {
			return next(new ApiError(403, 'Forbidden - insufficient role'));
		}

		return next();
	};
}

export default requireRole;
