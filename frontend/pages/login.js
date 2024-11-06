import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoginError('Invalid email or password');
      console.error('Error logging in:', error.message);
    } else {
      console.log('User logged in:', user);
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
        {loginError && <p style={styles.error}>{loginError}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    textAlign: 'center',
    fontFamily: 'Helvetica, Arial, sans-serif',
    backgroundColor: 'black',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '24px',
    color: '#e0e0e0',
    marginBottom: '20px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    transition: 'border-color 0.2s ease',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0070f3',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  error: {
    color: 'red',
    fontSize: '14px',
  },
};
