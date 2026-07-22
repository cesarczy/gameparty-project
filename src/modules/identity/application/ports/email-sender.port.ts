export interface PasswordResetEmailInput {
  to: string;
  userName: string;
  resetLink: string;
}

export interface EmailSender {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}
