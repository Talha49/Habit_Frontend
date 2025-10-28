import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCategories } from '../api/categories';

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('📂 CategoryContext: Loading categories...');
      setIsLoading(true);
      setError(null);

      const result = await getCategories();
      
      if (result.success) {
        setCategories(result.data);
        console.log(`✅ CategoryContext: Loaded ${result.count} categories`);
        
        // Set first category as default selection
        if (result.data.length > 0 && !selectedCategory) {
          setSelectedCategory(result.data[0]);
          console.log(`✅ CategoryContext: Default category set to: ${result.data[0].name}`);
        }
      } else {
        throw new Error(result.message || 'Failed to load categories');
      }
    } catch (err) {
      console.error('❌ CategoryContext: Failed to load categories:', err.message);
      setError(err.message);
      
      // Set fallback categories if API fails
      const fallbackCategories = [
        {
          _id: 'fallback-fitness',
          name: 'Fitness',
          description: 'Physical health and exercise habits',
          icon: 'fitness',
          color: '#FF6B6B',
          sortOrder: 1
        },
        {
          _id: 'fallback-study',
          name: 'Study',
          description: 'Learning and educational habits',
          icon: 'book',
          color: '#4ECDC4',
          sortOrder: 2
        }
      ];
      
      setCategories(fallbackCategories);
      setSelectedCategory(fallbackCategories[0]);
      console.log('⚠️ CategoryContext: Using fallback categories');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCategory = (category) => {
    if (category && categories.find(cat => cat._id === category._id)) {
      setSelectedCategory(category);
      console.log(`✅ CategoryContext: Selected category: ${category.name}`);
    } else {
      console.warn('⚠️ CategoryContext: Invalid category selection');
    }
  };

  const refreshCategories = async () => {
    console.log('🔄 CategoryContext: Refreshing categories...');
    await loadCategories();
  };

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat._id === categoryId);
  };

  const getCategoryByName = (categoryName) => {
    return categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  };

  const contextValue = {
    // State
    categories,
    selectedCategory,
    isLoading,
    error,
    
    // Actions
    selectCategory,
    refreshCategories,
    getCategoryById,
    getCategoryByName,
    
    // Computed values
    hasCategories: categories.length > 0,
    categoryCount: categories.length,
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Custom hook to use CategoryContext
export const useCategories = () => {
  const context = useContext(CategoryContext);
  
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  
  return context;
};
