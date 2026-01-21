import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors as themeColors } from '../constants/theme';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  allowFutureMonths?: boolean;
  minDate?: Date;
  monthsWithData?: Set<string>;
}

export default function MonthSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  allowFutureMonths = false,
  minDate,
  monthsWithData,
}: MonthSelectorProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const minMonth = minDate ? minDate.getMonth() : 0;
  const minYear = minDate ? minDate.getFullYear() : 0;

  const hasData = (year: number, month: number): boolean => {
    if (!monthsWithData) return true; // If no data provided, allow navigation
    return monthsWithData.has(`${year}-${month}`);
  };

  const shiftMonth = (offset: number) => {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    // Check if the new month is before app start date
    if (minDate && (newYear < minYear || (newYear === minYear && newMonth < minMonth))) {
      return;
    }

    // Check if the new month has data
    if (!hasData(newYear, newMonth)) {
      return;
    }

    // Check if the new month is in the future and if future months are not allowed
    if (!allowFutureMonths && (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth))) {
      return; // Don't allow navigation to future months
    }

    onMonthChange(newMonth, newYear);
  };

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
  const isBeforeAppStart = minDate && (selectedYear < minYear || (selectedYear === minYear && selectedMonth < minMonth));
  
  // Check if we can navigate to previous month
  let prevMonth = selectedMonth - 1;
  let prevYear = selectedYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevMonthHasData = hasData(prevYear, prevMonth);
  const canNavigatePrev = !isBeforeAppStart && prevMonthHasData && !(selectedYear === minYear && selectedMonth === minMonth);
  
  // Check if we can navigate to next month
  let nextMonth = selectedMonth + 1;
  let nextYear = selectedYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }
  const nextMonthHasData = hasData(nextYear, nextMonth);
  const isFutureNextMonth = nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);
  const canNavigateNext = nextMonthHasData && (allowFutureMonths || !isFutureNextMonth);

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => shiftMonth(-1)}
        style={[styles.navButton, !canNavigatePrev && styles.disabledButton]}
        disabled={!canNavigatePrev}
      >
        <Text style={[styles.navButtonText, !canNavigatePrev && styles.disabledText]}>◀</Text>
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Text style={styles.monthText}>{monthName}</Text>
        {isCurrentMonth && <Text style={styles.currentBadge}>Current</Text>}
      </View>

      <TouchableOpacity
        onPress={() => shiftMonth(1)}
        style={[styles.navButton, !canNavigateNext && styles.disabledButton]}
        disabled={!canNavigateNext}
      >
        <Text style={[styles.navButtonText, !canNavigateNext && styles.disabledText]}>▶</Text>
      </TouchableOpacity>

      {!isCurrentMonth && (
        <TouchableOpacity
          onPress={() => onMonthChange(currentMonth, currentYear)}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>Today</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: themeColors.surface,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  navButtonText: {
    color: themeColors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    color: themeColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    color: themeColors.primary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: themeColors.primary,
    borderRadius: 8,
  },
  resetButtonText: {
    color: themeColors.background,
    fontSize: 13,
    fontWeight: '600',
  },
});
