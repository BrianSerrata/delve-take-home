import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { hash } = window.location;
    if (hash) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/mfa-setup');
        }
      });
    }
  }, [router]);

  return <p>Processing authentication, please wait...</p>;
}