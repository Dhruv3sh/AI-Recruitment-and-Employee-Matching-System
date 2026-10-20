import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "Authentication is required." });
  try {
    req.auth = jwt.verify(
      token,
      process.env.JWT_SECRET || "development-only-secret",
    );
    next();
  } catch {
    res.status(401).json({ message: "Your session is invalid or expired." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.auth.role)
      ? next()
      : res
          .status(403)
          .json({ message: "You do not have access to this resource." });
}
