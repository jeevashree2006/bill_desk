import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { FileText } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error('Sign-in error:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in was cancelled.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.');
            } else {
                setError(err.message || 'Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-gradient"></div>
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <FileText size={32} color="#ffffff" />
                    </div>
                    <h1>BillDesk</h1>
                    <p className="login-subtitle">Invoice Management System</p>
                </div>

                <div className="login-divider"></div>

                <h2 className="login-heading">Welcome back</h2>
                <p className="login-description">Sign in to manage your invoices, track payments, and generate PDF bills.</p>

                {error && (
                    <div className="login-error">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                <button
                    className="login-google-btn"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="login-spinner"></div>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                <p className="login-footer-text">
                    Secure authentication powered by Firebase
                </p>
            </div>

            <style>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a0a1a;
                    position: relative;
                    overflow: hidden;
                    padding: 1rem;
                }

                .login-bg-gradient {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: 
                        radial-gradient(ellipse at 20% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 50%);
                    animation: loginGradientShift 15s ease-in-out infinite alternate;
                }

                @keyframes loginGradientShift {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(-2%, 2%) rotate(1deg); }
                    100% { transform: translate(2%, -1%) rotate(-1deg); }
                }

                .login-card {
                    position: relative;
                    width: 100%;
                    max-width: 420px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 3rem 2.5rem;
                    text-align: center;
                    box-shadow: 
                        0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                        0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: loginCardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes loginCardAppear {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .login-logo {
                    margin-bottom: 1.5rem;
                }

                .login-logo-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #2563eb, #6366f1);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
                }

                .login-logo h1 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #ffffff;
                    letter-spacing: -0.02em;
                }

                .login-subtitle {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }

                .login-divider {
                    width: 48px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    margin: 1.5rem auto;
                }

                .login-heading {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 0.5rem;
                }

                .login-description {
                    color: rgba(255, 255, 255, 0.45);
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin-bottom: 2rem;
                }

                .login-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px;
                    padding: 0.875rem 1rem;
                    margin-bottom: 1.5rem;
                    text-align: left;
                }

                .login-error p {
                    color: #fca5a5;
                    font-size: 0.8125rem;
                    line-height: 1.4;
                }

                .login-google-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1.5rem;
                    background: rgba(255, 255, 255, 0.95);
                    color: #1e293b;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .login-google-btn:hover:not(:disabled) {
                    background: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }

                .login-google-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .login-google-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .login-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e2e8f0;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: loginSpin 0.6s linear infinite;
                }

                @keyframes loginSpin {
                    to { transform: rotate(360deg); }
                }

                .login-footer-text {
                    color: rgba(255, 255, 255, 0.25);
                    font-size: 0.75rem;
                    margin-top: 1.5rem;
                }

                @media (max-width: 480px) {
                    .login-card {
                        padding: 2rem 1.5rem;
                        border-radius: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
