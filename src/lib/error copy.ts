export class CustomAuthError extends Error {
  code: string;

  constructor(codeWithEmail: string) {
    super(codeWithEmail); // Format: "OtpVerificationRequired:user@example.com"
    this.name = "CustomAuthError";
    this.code = codeWithEmail;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
