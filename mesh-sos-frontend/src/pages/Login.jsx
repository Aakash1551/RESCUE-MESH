import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    
    // Form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (isLogin) {
            const success = await login(username, password);
            if (success) {
                toast.success('Logged in successfully');
            } else {
                toast.error('Invalid username or password');
            }
        } else {
            if (password !== confirmPassword) {
                toast.error('Passwords do not match');
                setIsSubmitting(false);
                return;
            }
            const success = await register({ name, username, email, password });
            if (success) {
                toast.success('Account created and logged in!');
            } else {
                toast.error('Registration failed. Username or email might be taken.');
            }
        }
        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>RESCUE-MESH</h2>
                    <p>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>
                
                <div className="auth-tabs">
                    <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Login</button>
                    <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Register</button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                                placeholder="Enter full name"
                            />
                        </div>
                    )}
                    
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required={!isLogin}
                                placeholder="Enter email address"
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter password"
                        />
                    </div>
                    
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required={!isLogin}
                                placeholder="Confirm password"
                            />
                        </div>
                    )}
                    
                    <button type="submit" className="login-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
