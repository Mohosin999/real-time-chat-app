import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport";
import { controllers as authControllers } from "../api/v1/auth";
import { controllers as chatControllers } from "../api/v1/chat";
import { controllers as userControllers } from "../api/v1/user";
import { controllers as messageControllers } from "../api/v1/message";
import { isAuthenticated } from "../middleware/isAuthenticated";

const router = Router();

/* -------------------------------------------
               AUTH ROUTES
-------------------------------------------- */
router
  .post("/api/v1/auth/register", authControllers.register)
  .post("/api/v1/auth/login", authControllers.login)
  .post("/api/v1/auth/logout", authControllers.logout)
  .get("/api/v1/auth/status", isAuthenticated, authControllers.authStatus);

router.get("/me", isAuthenticated, (req, res) =>
  res.json({
    seccess: true,
    user: req.user,
  })
);

/* -------------------------------------------
              PROTECTED ROUTES
------------------------------------------- */
router
  .post("/api/v1/chats", passportAuthenticateJwt, chatControllers.createChat)
  .get("/api/v1/chats", passportAuthenticateJwt, chatControllers.getUserChats)
  .get("/api/v1/chats/:id", passportAuthenticateJwt, chatControllers.getSingleChat)
  .delete("/api/v1/chats/:chatId", passportAuthenticateJwt, chatControllers.deleteChat);

// Message routes
router.post("/api/v1/messages", passportAuthenticateJwt, messageControllers.sendMessage);
router.delete("/api/v1/messages/:messageId", passportAuthenticateJwt, messageControllers.deleteMessage);

// User route
router.get("/api/v1/users", passportAuthenticateJwt, userControllers.getUsers);
router.put("/api/v1/users/profile", passportAuthenticateJwt, userControllers.updateProfile);
router.delete("/api/v1/users/account", passportAuthenticateJwt, userControllers.deleteAccount);

export default router;
