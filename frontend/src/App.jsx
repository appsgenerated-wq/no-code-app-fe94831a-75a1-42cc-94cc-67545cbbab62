import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './screens/LandingPage';
import DashboardPage from './screens/DashboardPage';
import { testBackendConnection, createManifestWithLogging } from './services/apiService';
import config from './constants.js';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState(false);

  const manifestRef = useRef(null);
  if (!manifestRef.current) {
    manifestRef.current = createManifestWithLogging();
  }
  const manifest = manifestRef.current;

  useEffect(() => {
    testBackendConnection().then(result => {
      setBackendStatus(result.success);
      console.log(`Backend connection status: ${result.success ? 'OK' : 'Failed'}`);
    });

    const checkUserSession = async () => {
      try {
        const currentUser = await manifest.from('users').me();
        setUser(currentUser);
        setCurrentScreen('dashboard');
      } catch (error) {
        setUser(null);
        setCurrentScreen('landing');
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    await manifest.login('users', email, password);
    const loggedInUser = await manifest.from('users').me();
    setUser(loggedInUser);
    setCurrentScreen('dashboard');
  };

  const signup = async (email, password, name) => {
    await manifest.signup('users', email, password);
    await manifest.login('users', email, password);
    const currentUser = await manifest.from('users').me();
    await manifest.from('users').update(currentUser.id, { name, role: 'owner' });
    const updatedUser = await manifest.from('users').me();
    setUser(updatedUser);
    setCurrentScreen('dashboard');
  };

  const logout = async () => {
    await manifest.logout();
    setUser(null);
    setRestaurants([]);
    setCurrentScreen('landing');
  };

  const loadRestaurants = async () => {
    // Policy Check: Restaurant read access is public, so we use .find()
    const response = await manifest.from('restaurants').with(['owner']).orderBy('createdAt', { desc: true }).find();
    setRestaurants(response.data || []);
  };

  const createRestaurant = async (restaurantData) => {
    // Policy Check: Always add ownerId for belongsTo relationships
    const restaurantWithOwner = { ...restaurantData, ownerId: user.id };
    await manifest.from('restaurants').create(restaurantWithOwner);
    loadRestaurants();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing PlatePerfect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
       {!backendStatus && (
        <div className="bg-red-600 text-white text-center p-2">
          Backend connection failed. Please ensure the server is running.
        </div>
      )}
      {currentScreen === 'landing' ? (
        <LandingPage onLogin={login} onSignup={signup} />
      ) : (
        <DashboardPage
          user={user}
          restaurants={restaurants}
          onLogout={logout}
          onLoadRestaurants={loadRestaurants}
          onCreateRestaurant={createRestaurant}
          manifest={manifest}
        />
      )}
    </div>
  );
}

export default App;
