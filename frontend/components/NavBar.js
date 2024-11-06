// Adjusting styles in the NavBar and Signup components for Delve-like styling

// NavBar Component
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav style={navStyles.nav}>
      <Link href="/signup" style={navStyles.link}>Sign Up</Link>
      <Link href="/login" style={navStyles.link}>Login</Link>
    </nav>
  );
}

const navStyles = {
  nav: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '20px',
    backgroundColor: 'black',
    borderBottom: '1px solid black',
    fontFamily: 'Helvetica, Arial, sans-serif',
  },
  link: {
    marginLeft: '20px',
    color: '#0070f3',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '16px',
    transition: 'color 0.3s ease',
  },
};