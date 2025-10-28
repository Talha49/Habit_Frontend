import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../context/CategoryContext';
import { colors } from '../config/colors';

const CategorySelector = ({ 
  style, 
  showLabel = true, 
  compact = false,
  onCategoryChange 
}) => {
  const { 
    categories, 
    selectedCategory, 
    selectCategory, 
    isLoading, 
    error 
  } = useCategories();
  
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCategorySelect = (category) => {
    selectCategory(category);
    setIsModalVisible(false);
    
    // Call optional callback
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    
    console.log(`✅ CategorySelector: Selected ${category.name}`);
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const renderCategoryItem = (category, isSelected = false) => (
    <TouchableOpacity
      key={category._id}
      style={[
        styles.categoryItem,
        isSelected && styles.selectedCategoryItem,
        { borderLeftColor: category.color }
      ]}
      onPress={() => handleCategorySelect(category)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Ionicons 
            name={getIconName(category.icon)} 
            size={20} 
            color={category.color} 
          />
        </View>
        <View style={styles.categoryTextContainer}>
          <Text style={[
            styles.categoryName,
            isSelected && styles.selectedCategoryName
          ]}>
            {category.name}
          </Text>
          {!compact && (
            <Text style={[
              styles.categoryDescription,
              isSelected && styles.selectedCategoryDescription
            ]}>
              {category.description}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const getIconName = (iconName) => {
    const iconMap = {
      'fitness': 'fitness',
      'book': 'book',
      'heart': 'heart',
      'briefcase': 'briefcase',
      'people': 'people',
      'brush': 'brush',
      'leaf': 'leaf',
      'card': 'card',
    };
    return iconMap[iconName] || 'ellipse';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        {showLabel && <Text style={styles.label}>Category</Text>}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        {showLabel && <Text style={styles.label}>Category</Text>}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load categories</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showLabel && <Text style={styles.label}>Category</Text>}
      
      <TouchableOpacity
        style={[
          styles.selectorButton,
          compact && styles.compactSelectorButton
        ]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {selectedCategory && (
            <>
              <View style={[
                styles.selectorIcon, 
                { backgroundColor: selectedCategory.color + '20' }
              ]}>
                <Ionicons 
                  name={getIconName(selectedCategory.icon)} 
                  size={compact ? 16 : 20} 
                  color={selectedCategory.color} 
                />
              </View>
              <View style={styles.selectorTextContainer}>
                <Text style={[
                  styles.selectorText,
                  compact && styles.compactSelectorText
                ]}>
                  {selectedCategory.name}
                </Text>
                {!compact && (
                  <Text style={styles.selectorSubtext}>
                    {selectedCategory.description}
                  </Text>
                )}
              </View>
            </>
          )}
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colors.text.secondary} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {categories.map((category) => 
              renderCategoryItem(category, category._id === selectedCategory?._id)
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  compactSelectorButton: {
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  compactSelectorText: {
    fontSize: 14,
  },
  selectorSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  categoryItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.border.light,
  },
  selectedCategoryItem: {
    backgroundColor: colors.primary + '10',
    borderLeftColor: colors.primary,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  selectedCategoryName: {
    color: colors.primary,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  selectedCategoryDescription: {
    color: colors.text.primary,
  },
});

export default CategorySelector;
