import { AuthPage } from "./AuthPage";

export function RegisterPage({ onSuccess }) {
  return <AuthPage mode="register" onSuccess={onSuccess} />;
}
