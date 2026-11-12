import { TheaterLobby } from '@/components/auth/TheaterLobby';
import './auth-theatre.css';

export const metadata = { icons: { icon: '/brand/stage-mark.svg' } };

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TheaterLobby>{children}</TheaterLobby>;
}
