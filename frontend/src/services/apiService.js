import config from '../constants.js';
import Manifest from '@mnfst/sdk';

// Enhanced connection test function with retry logic
export const testBackendConnection = async (retries = 3) => {
  console.log('🔍 [CONNECTION] Testing backend connection...');
  console.log('🔍 [CONNECTION] Backend URL:', config.BACKEND_URL);
  console.log('🔍 [CONNECTION] App ID:', config.APP_ID);
  console.log('🔍 [CONNECTION] Retry attempts:', retries);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 [CONNECTION] Attempt ${attempt}/${retries}...`);
      
      const response = await fetch(`${config.BACKEND_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': config.APP_ID
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [CONNECTION] Backend connection successful!');
        console.log('✅ [CONNECTION] Status:', response.status, response.statusText);
        console.log('✅ [CONNECTION] Response data:', data);
        return { success: true, status: response.status, data };
      } else {
        console.error(`❌ [CONNECTION] Attempt ${attempt} failed!`);
        console.error('❌ [CONNECTION] Status:', response.status, response.statusText);
        
        if (attempt === retries) {
          return { success: false, status: response.status, error: response.statusText };
        }
      }
    } catch (error) {
      console.error(`❌ [CONNECTION] Attempt ${attempt} error:`, error);
      
      if (attempt === retries) {
        console.error('❌ [CONNECTION] All attempts failed. This usually means:');
        console.error('   - Backend is not running');
        console.error('   - Backend URL is incorrect');
        console.error('   - CORS issues');
        console.error('   - Network connectivity problems');
        return { success: false, error: error.message };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Enhanced Manifest SDK wrapper with logging
export const createManifestWithLogging = () => {
  console.log('🔍 [MANIFEST] Creating Manifest SDK instance...');
  console.log('🔍 [MANIFEST] Backend URL:', config.BACKEND_URL);

  // Initialize Manifest SDK with the correct backend URL (official pattern)
  const manifest = new Manifest(config.BACKEND_URL);
  
  // Wrap common methods with logging
  const originalFrom = manifest.from.bind(manifest);
  manifest.from = (entity) => {
    console.log(`🔍 [MANIFEST] Accessing entity: ${entity}`);
    
    const entityMethods = originalFrom(entity);
    
    // Wrap find method
    const originalFind = entityMethods.find.bind(entityMethods);
    entityMethods.find = async (options = {}) => {
      console.log(`🔍 [MANIFEST] Finding ${entity} with options:`, options);
      try {
        const result = await originalFind(options);
        console.log(`✅ [MANIFEST] Found ${entity}:`, result);
        return result;
      } catch (error) {
        console.error(`❌ [MANIFEST] Error finding ${entity}:`, error);
        throw error;
      }
    };
    
    // Wrap create method
    const originalCreate = entityMethods.create.bind(entityMethods);
    entityMethods.create = async (data) => {
      console.log(`🔍 [MANIFEST] Creating ${entity} with data:`, data);
      try {
        const result = await originalCreate(data);
        console.log(`✅ [MANIFEST] Created ${entity}:`, result);
        return result;
      } catch (error) {
        console.error(`❌ [MANIFEST] Error creating ${entity}:`, error);
        throw error;
      }
    };
    
    // Wrap me method
    const originalMe = entityMethods.me.bind(entityMethods);
    entityMethods.me = async () => {
      console.log(`🔍 [MANIFEST] Getting current ${entity}...`);
      try {
        const result = await originalMe();
        console.log(`✅ [MANIFEST] Current ${entity}:`, result);
        return result;
      } catch (error) {
        console.error(`❌ [MANIFEST] Error getting current ${entity}:`, error);
        throw error;
      }
    };
    
    return entityMethods;
  };
  
  // Wrap authentication methods with logging
  const originalLogin = manifest.login.bind(manifest);
  manifest.login = async (entity, email, password) => {
    console.log(`🔍 [MANIFEST] Logging in with email:`, email, `for entity:`, entity);
    try {
      const result = await originalLogin(entity, email, password);
      console.log(`✅ [MANIFEST] Login successful`);
      return result;
    } catch (error) {
      console.error(`❌ [MANIFEST] Login failed:`, error);
      throw error;
    }
  };
  
  const originalSignup = manifest.signup.bind(manifest);
  manifest.signup = async (entity, email, password) => {
    console.log(`🔍 [MANIFEST] Signing up with email:`, email, `for entity:`, entity);
    try {
      const result = await originalSignup(entity, email, password);
      console.log(`✅ [MANIFEST] Signup successful`);
      return result;
    } catch (error) {
      console.error(`❌ [MANIFEST] Signup failed:`, error);
      throw error;
    }
  };
  
  const originalLogout = manifest.logout.bind(manifest);
  manifest.logout = async () => {
    console.log('🔍 [MANIFEST] Logging out...');
    try {
      const result = await originalLogout();
      console.log('✅ [MANIFEST] Logout successful');
      return result;
    } catch (error) {
      console.error('❌ [MANIFEST] Logout failed:', error);
      throw error;
    }
  };
  
  return manifest;
};