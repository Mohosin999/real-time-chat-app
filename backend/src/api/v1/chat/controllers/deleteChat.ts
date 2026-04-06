import { Request, Response } from "express";
import { asyncHandler } from "../../../../middleware/asyncHandler";
import { deleteChatService } from "../../../../lib/chat";

export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { chatId } = req.params;

  await deleteChatService(chatId, userId as string);

  return res.status(200).json({
    message: "Chat deleted successfully",
  });
});
