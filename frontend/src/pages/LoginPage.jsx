import { AuthPage } from "./AuthPage";

export function LoginPage({ onSuccess }) {
  return <AuthPage mode="login" onSuccess={onSuccess} />;
}
