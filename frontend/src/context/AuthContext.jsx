import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('budgetbuddy_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('budgetbuddy_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Sign up function
  const signup = async (name, email, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('budgetbuddy_users') || '[]');
    if (existingUsers.find(u => u.email === email)) {
      throw new Error('An account with this email already exists');
    }
    
    // Create new user
    const newUser = {
      id: Date.now(),
      name,
      email,
      createdAt: new Date().toISOString()
    };
    
    // Save to "database"
    existingUsers.push({ ...newUser, password });
    localStorage.setItem('budgetbuddy_users', JSON.stringify(existingUsers));
    
    // Log in the user
    setUser(newUser);
    localStorage.setItem('budgetbuddy_user', JSON.stringify(newUser));
    
    // Initialize profile
    localStorage.setItem('budgetbuddy_profile', JSON.stringify({
      name,
      email,
      phone: '',
      currency: '₹',
      monthStartDay: 1
    }));
    
    return newUser;
  };

  // Login function
  const login = async (email, password) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existingUsers = JSON.parse(localStorage.getItem('budgetbuddy_users') || '[]');
    const foundUser = existingUsers.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }
    
    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('budgetbuddy_user', JSON.stringify(userWithoutPassword));
    
    return userWithoutPassword;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('budgetbuddy_user');
  };

  // Update user profile
  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('budgetbuddy_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
