import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { colors as themeColors } from '../constants/theme';

interface TimePickerProps {
  selectedHour: number;
  onTimeChange: (hour: number) => void;
}

export default function TimePicker({
  selectedHour,
  onTimeChange,
}: TimePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempHour, setTempHour] = useState(selectedHour % 12 || 12);
  const [tempPeriod, setTempPeriod] = useState(selectedHour < 12 ? 'AM' : 'PM');
  const [hourDropdownOpen, setHourDropdownOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const handleConfirm = () => {
    let finalHour = tempHour;
    if (tempPeriod === 'PM' && tempHour !== 12) {
      finalHour = tempHour + 12;
    } else if (tempPeriod === 'AM' && tempHour === 12) {
      finalHour = 0;
    }
    onTimeChange(finalHour);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempHour(selectedHour % 12 || 12);
    setTempPeriod(selectedHour < 12 ? 'AM' : 'PM');
    setHourDropdownOpen(false);
    setPeriodDropdownOpen(false);
    setModalVisible(false);
  };

  const formatTime = (hour: number) => {
    const period = hour < 12 ? 'AM' : 'PM';
    const display12h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${String(display12h).padStart(2, '0')}:00 ${period}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.timeButtonLabel}>⏰ Select Time</Text>
        <Text style={styles.timeButtonValue}>
          {formatTime(selectedHour)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>

            {/* Dropdowns Container */}
            <View style={styles.dropdownsContainer}>
              {/* Hour Dropdown */}
              <View style={styles.dropdownWrapper}>
                <Text style={styles.dropdownLabel}>Hour</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setHourDropdownOpen(!hourDropdownOpen);
                    setPeriodDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownValue}>{tempHour}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {hourDropdownOpen && (
                  <ScrollView
                    style={styles.dropdownMenu}
                    nestedScrollEnabled={true}
                    bounces={false}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.dropdownItem,
                          tempHour === hour && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setTempHour(hour);
                          setHourDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            tempHour === hour && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Period Dropdown */}
              <View style={styles.dropdownWrapper}>
                <Text style={styles.dropdownLabel}>Period</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setPeriodDropdownOpen(!periodDropdownOpen);
                    setHourDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownValue}>{tempPeriod}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {periodDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {['AM', 'PM'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.dropdownItem,
                          tempPeriod === period && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setTempPeriod(period);
                          setPeriodDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            tempPeriod === period && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Selected Time:</Text>
              <Text style={styles.previewTime}>
                {String(tempHour).padStart(2, '0')}:00 {tempPeriod}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  timeButton: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.primary,
  },
  timeButtonValue: {
    fontSize: 14,
    fontWeight: '700',
    color: themeColors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    width: '100%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: themeColors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.text,
  },
  dropdownArrow: {
    fontSize: 12,
    color: themeColors.muted,
  },
  dropdownMenu: {
    backgroundColor: themeColors.card,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.muted,
    textAlign: 'center',
  },
  dropdownItemTextSelected: {
    color: themeColors.primary,
    fontWeight: '700',
  },
  previewBox: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.muted,
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: themeColors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.muted,
  },
  confirmButton: {
    backgroundColor: themeColors.primary,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.background,
  },
});
