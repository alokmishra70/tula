import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';

export default function Index() {
  const onboarded = useSession((state) => state.onboarded);
  return <Redirect href={onboarded ? '/today' : '/welcome'} />;
}
