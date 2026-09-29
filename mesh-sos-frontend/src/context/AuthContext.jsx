import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const res = await apiClient.get('/api/v1/auth/me');
            setUser(res.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Failed to load user', err);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('mesh_auth_token');
        }
        setLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('mesh_auth_token');
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await apiClient.post('/api/v1/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            const { access_token } = response.data;
            localStorage.setItem('mesh_auth_token', access_token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            
            await loadUser();
            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const register = async (userData) => {
        try {
            await apiClient.post('/api/v1/auth/register', userData);
            return await login(userData.username, userData.password);
        } catch (error) {
            console.error('Registration failed', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('mesh_auth_token');
        delete apiClient.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff' }}>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
