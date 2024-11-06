import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function MFASetup() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaError, setMfaError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndEnrollMFA = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        enrollMFA();
      } else {
        router.push('/login');
      }
    };

    checkSessionAndEnrollMFA();
  }, [router]);

  const enrollMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error) {
      setMfaError('Failed to enroll MFA. Please try again.');
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMfaError(null);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      router.push('/dashboard');
    } catch (error) {
      setMfaError(`Failed to verify MFA code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Enable Two-Factor Authentication</h2>
      {qrCode ? (
        <>
          <p>Scan the QR code with your authenticator app:</p>
          <img src={qrCode} alt="QR Code for MFA" style={styles.qrCode} />
          <p>Or enter this secret key: <strong>{secret}</strong></p>
          <form onSubmit={handleMfaVerification} style={styles.form}>
            <input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : 'Verify and Complete Setup'}
            </button>
          </form>
        </>
      ) : (
        <p>Loading QR code...</p>
      )}
      {mfaError && <p style={styles.error}>{mfaError}</p>}
    </div>
  );
}


const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  qrCode: {
    width: '200px',
    height: '200px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#0070f3',
    color: '#fff',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginTop: '10px',
  },
};
