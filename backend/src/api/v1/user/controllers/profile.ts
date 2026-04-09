import { Request, Response } from "express";
import { asyncHandler } from "../../../../middleware/asyncHandler";
import User from "../../../../model/User";

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { name } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  return res.status(200).json({
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    message: "Account deleted successfully",
  });
});
