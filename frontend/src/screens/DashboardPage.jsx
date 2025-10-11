import React, { useEffect, useState } from 'react';
import config from '../constants.js';

const DashboardPage = ({ user, restaurants, onLogout, onLoadRestaurants, onCreateRestaurant, manifest }) => {
  const [newRestaurant, setNewRestaurant] = useState({ name: '', description: '', address: '' });
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', description: '', price: 0.00, category: 'Main' });

  useEffect(() => {
    onLoadRestaurants();
  }, []);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    await onCreateRestaurant(newRestaurant);
    setNewRestaurant({ name: '', description: '', address: '' });
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    // Policy Check: MenuItem read access is public, so we can use .find()
    const response = await manifest.from('menu-items').where({ restaurantId: restaurant.id }).orderBy('createdAt', {desc: true}).find();
    setMenuItems(response.data || []);
  }

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    // Policy Check: Always add ownerId for belongsTo relationships
    const itemWithOwner = { ...newMenuItem, restaurantId: selectedRestaurant.id, ownerId: user.id };
    await manifest.from('menu-items').create(itemWithOwner);
    setNewMenuItem({ name: '', description: '', price: 0.00, category: 'Main' });
    handleSelectRestaurant(selectedRestaurant); // Refresh menu items
  }

  const myRestaurants = restaurants.filter(r => r.ownerId === user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">PlatePerfect Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}!</span>
            <a href={`${config.BACKEND_URL}/admin`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-green-600 hover:text-green-800">Admin Panel</a>
            <button onClick={onLogout} className="text-sm font-medium text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* My Restaurants List */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">My Restaurants</h2>
            {myRestaurants.length === 0 ? (
              <p className="text-gray-500 text-sm">You haven't created any restaurants yet.</p>
            ) : (
              <ul className="space-y-2">
                {myRestaurants.map(restaurant => (
                  <li key={restaurant.id}>
                    <button onClick={() => handleSelectRestaurant(restaurant)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedRestaurant?.id === restaurant.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {restaurant.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Create New Restaurant Form */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Create a New Restaurant</h2>
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <input type="text" placeholder="Restaurant Name" value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className="w-full p-2 border rounded-md" required />
              <textarea placeholder="Description" value={newRestaurant.description} onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })} className="w-full p-2 border rounded-md" />
              <input type="text" placeholder="Address" value={newRestaurant.address} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} className="w-full p-2 border rounded-md" />
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Create Restaurant</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {/* Menu Management Area */}
          {selectedRestaurant ? (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-2xl font-bold mb-1">{selectedRestaurant.name} Menu</h2>
              <p className="text-gray-500 mb-6">{selectedRestaurant.address}</p>
              
              {/* Create New Menu Item Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                 <h3 className="text-lg font-semibold mb-3">Add New Menu Item</h3>
                 <form onSubmit={handleCreateMenuItem} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input type="text" placeholder="Item Name" value={newMenuItem.name} onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })} className="w-full p-2 border rounded-md md:col-span-2" required />
                    <input type="number" placeholder="Price" value={newMenuItem.price} onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) })} className="w-full p-2 border rounded-md" step="0.01" min="0" />
                    <select value={newMenuItem.category} onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })} className="w-full p-2 border rounded-md bg-white">
                        <option>Appetizer</option><option>Main</option><option>Dessert</option><option>Beverage</option>
                    </select>
                    <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Add Item</button>
                 </form>
              </div>

              {/* Menu Items List */}
              {menuItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">This restaurant's menu is empty. Add the first item!</p>
              ) : (
                <div className="space-y-4">
                  {menuItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-green-600 font-bold text-lg">${item.price.toFixed(2)}</p>
                           <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{item.category}</p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-lg shadow border flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Select one of your restaurants to manage its menu.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
