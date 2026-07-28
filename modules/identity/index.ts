// Identity & Access — the public API. Nothing outside this folder may import
// any other file in it.
//
// The one rule this module exists to hold: a person's role is read from the
// database, server-side, on every request. It is never taken from a form field,
// a cookie, a query string or anything else the browser can set.

export {
  authorizeRole,
  changeUserRole,
  completeCodeExchange,
  getCurrentUser,
  getViewer,
  listAccounts,
  registerEmployer,
  sendPasswordReset,
  setPreviewRole,
  signInWithPassword,
  signOut,
  signUpStudent,
  startGoogleSignIn,
  updatePassword,
} from "./auth-service";

export {
  canAccessRoute,
  canChangeRole,
  canViewArea,
  homeRouteForRole,
  postSignInRoute,
  safeNextPath,
} from "./roles";

export { ACCOUNT_LIST_LIMIT } from "./user-account-repo";

export type {
  AccountSummary,
  AuthenticatedUser,
  AuthOutcome,
  UserRole,
  Viewer,
} from "./types";
