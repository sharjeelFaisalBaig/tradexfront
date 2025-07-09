import { SignInError, Verification } from "@auth/core/errors";
import { AuthError, CredentialsSignin } from "next-auth";

export class CustomAuthError extends Verification implements AuthError {
  code: string;
  message: string;

  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
    this.message = message || "2faEnabled";
  }
}
// export class TwoFAEnabledError extends AuthError {
//   code: string;
//   message: string;
//   //type: "AccessDenied" | "AdapterError" | "CallbackRouteError" | "ErrorPageLoop" | "EventError" | "InvalidCallbackUrl" | "CredentialsSignin" | "InvalidEndpoints" | "InvalidCheck" | "JWTSessionError" | "MissingAdapter" | "MissingAdapterMethods" | "MissingAuthorize" | "MissingSecret" | "OAuthAccountNotLinked" | "OAuthCallbackError" | "OAuthProfileParseError" | "SessionTokenError" | "OAuthSignInError" | "EmailSignInError" | "SignOutError" | "UnknownAction" | "UnsupportedStrategy" | "InvalidProvider" | "UntrustedHost" | "Verification" | "MissingCSRF" | "AccountNotLinked" | "DuplicateConditionalUI" | "MissingWebAuthnAutocomplete" | "WebAuthnVerificationError" | "ExperimentalFeatureNotEnabled";
//   static type: string = "2FaEnabled";
//   constructor(message?: string) {
//     super(message);
//     this.code = "2faEnabled";
//     this.message = message || "Two-factor authentication is required.";
//   }
// }