import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { colors as themeColors } from '../constants/theme';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  currentRoute?: string;
}

interface MenuItem {
  name: string;
  route: string;
  icon: 'house.fill' | 'doc.text.fill' | 'list.bullet' | 'creditcard.fill' | 'chart.bar.fill' | 'gearshape.fill';
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', route: 'index', icon: 'house.fill' },
  { name: 'Bills', route: 'bills', icon: 'doc.text.fill' },
  { name: 'Transactions', route: 'explore', icon: 'list.bullet' },
  { name: 'Accounts', route: 'accounts', icon: 'creditcard.fill' },
  { name: 'Reports', route: 'reports', icon: 'chart.bar.fill' },
  { name: 'Settings', route: 'settings', icon: 'gearshape.fill' },
];

export default function HamburgerMenu({ visible, onClose, currentRoute }: HamburgerMenuProps) {
  const router = useRouter();

  const handleNavigate = useCallback((route: string) => {
    if (currentRoute !== route) {
      onClose();
      // Add small delay to allow modal to close first
      setTimeout(() => {
        if (route === 'index') {
          router.replace('/(tabs)' as any);
        } else {
          router.replace(`/(tabs)/${route}` as any);
        }
      }, 300);
    } else {
      onClose();
    }
  }, [currentRoute, onClose, router]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Menu Container - LEFT SIDE */}
        <View style={[styles.menuContainer, { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={[styles.menuHeader, { backgroundColor: themeColors.primary }]}>
            <Text style={[styles.menuTitle, { color: themeColors.background }]}>
              Menu
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={themeColors.background} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuItems}>
            {menuItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuItem,
                    isActive && [styles.menuItemActive],
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name={item.icon}
                    size={24}
                    color={isActive ? themeColors.primary : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: isActive ? themeColors.primary : themeColors.text,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Backdrop - tap to close - RIGHT SIDE */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuContainer: {
    width: 280,
    height: '100%',
    flexDirection: 'column',
    backgroundColor: themeColors.surface,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: themeColors.background,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  menuItems: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: themeColors.card,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    color: themeColors.text,
  },
});
