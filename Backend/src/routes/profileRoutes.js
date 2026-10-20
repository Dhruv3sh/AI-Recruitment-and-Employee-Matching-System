import { Router } from "express";
import { updateProfile } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const profileRoutes = Router();
profileRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    next(error);
  }
});
profileRoutes.patch(
  "/me",
  requireAuth,
  requireRole("candidate"),
  updateProfile,
);
