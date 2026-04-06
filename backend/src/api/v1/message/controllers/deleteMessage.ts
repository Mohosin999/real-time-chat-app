import { Request, Response } from "express";
import { asyncHandler } from "../../../../middleware/asyncHandler";
import { deleteMessageService } from "../../../../lib/message";

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { messageId } = req.params;

  await deleteMessageService(messageId, userId as string);

  return res.status(200).json({
    message: "Message deleted successfully",
  });
});
