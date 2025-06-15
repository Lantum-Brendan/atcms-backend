/**
 * Middleware to restrict route access based on user roles
 * @param {string[]} roles - Array of allowed roles
 */
exports.restrictTo = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to perform this action',
                code: 403
            });
        }
        next();
    };
};
