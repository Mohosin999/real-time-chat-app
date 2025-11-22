import { Request, Response } from "express";
import { generateJwtToken } from "../../../../lib/token";

export const googleLoginCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const token = generateJwtToken({ userId: user._id });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.redirect(process.env.FRONTEND_ORIGIN!);
    // return res.redirect(
    //   `${process.env.FRONTEND_ORIGIN}/auth-success?token=${token}`
    // );
  } catch (error) {
    console.log(error);
    return res.redirect(
      `${process.env.FRONTEND_ORIGIN}/login?error=google_failed`
    );
  }
};
