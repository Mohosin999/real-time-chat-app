// import SignIn from "@/pages/auth/sign-in";
// import SignUp from "@/pages/auth/sign-up";
// import Chat from "@/pages/chat";
// import SingleChat from "@/pages/chat/chatId";

// export const AUTH_ROUTES = {
//   SIGN_IN: "/",
//   SIGN_UP: "/sign-up",
// };

// export const PROTECTED_ROUTES = {
//   CHAT: "/chat",
//   SINGLE_CHAT: "/chat/:chatId",
// };

// export const authRoutesPaths = [
//   {
//     path: AUTH_ROUTES.SIGN_IN,
//     element: <SignIn />,
//   },
//   {
//     path: AUTH_ROUTES.SIGN_UP,
//     element: <SignUp />,
//   },
// ];

// export const protectedRoutesPaths = [
//   {
//     path: PROTECTED_ROUTES.CHAT,
//     element: <Chat />,
//   },
//   {
//     path: PROTECTED_ROUTES.SINGLE_CHAT,
//     element: <SingleChat />,
//   },
// ];

// export const isAuthRoute = (pathname: string) => {
//   return Object.values(AUTH_ROUTES).includes(pathname);
// };

import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import Chat from "@/pages/chat";
import SingleChat from "@/pages/chat/chatId";

export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in", // <-- changed from "/" to "/login"
  SIGN_UP: "/sign-up",
};

export const PROTECTED_ROUTES = {
  HOME: "/", // home page for logged in users
  CHAT: "/chat",
  SINGLE_CHAT: "/chat/:chatId",
  ACCOUNT: "/account",
};

export const authRoutesPaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: <SignIn /> },
  { path: AUTH_ROUTES.SIGN_UP, element: <SignUp /> },
];

export const protectedRoutesPaths = [
  { path: PROTECTED_ROUTES.HOME, element: <Chat /> },
  { path: PROTECTED_ROUTES.CHAT, element: <Chat /> },
  { path: PROTECTED_ROUTES.SINGLE_CHAT, element: <SingleChat /> },
];

export const isAuthRoute = (pathname: string) => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};
