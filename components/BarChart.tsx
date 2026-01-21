import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors as themeColors } from '../constants/theme';

interface BarChartData {
  label: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
}

export default function BarChart({
  data,
  title = 'Income vs Expense',
  height = 400,
}: BarChartProps) {
  const padding = 50;
  const topPadding = 70; // Extra space for value labels
  const chartHeight = height - padding - topPadding;
  const barWidth = 16;
  const groupSpacing = 80; // More spacing for 12 months
  const chartWidth = Math.max(500, data.length * groupSpacing + padding * 2);

  // Calculate max value for scaling
  const maxValue = Math.max(...data.flatMap(d => [d.income, d.expense]));
  const scale = maxValue > 0 ? chartHeight / maxValue : 1;

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {/* Y-axis */}
          <Line
            x1={padding}
            y1={topPadding}
            x2={padding}
            y2={height - padding}
            stroke={themeColors.muted}
            strokeWidth="1.5"
          />
          
          {/* X-axis */}
          <Line
            x1={padding}
            y1={height - padding}
            x2={chartWidth - padding}
            y2={height - padding}
            stroke={themeColors.muted}
            strokeWidth="1.5"
          />

          {/* Grid lines and Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - padding - ratio * chartHeight;
            const value = Math.round(maxValue * ratio);
            return (
              <G key={`grid-${idx}`}>
                <Line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.5"
                  strokeDasharray="5,5"
                />
                <SvgText
                  x={padding - 10}
                  y={y + 5}
                  fontSize="12"
                  fontWeight="500"
                  fill={themeColors.muted}
                  textAnchor="end"
                >
                  ₹{(value / 1000).toFixed(0)}K
                </SvgText>
              </G>
            );
          })}

          {/* Bars and labels */}
          {data.map((item, idx) => {
            const groupX = padding + idx * groupSpacing;
            const incomeHeight = item.income * scale;
            const expenseHeight = item.expense * scale;
            const incomeY = height - padding - incomeHeight;
            const expenseY = height - padding - expenseHeight;

            return (
              <G key={`bar-group-${idx}`}>
                {/* Income bar */}
                <Rect
                  x={groupX - barWidth - 4}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  fill="#4CAF50"
                  rx="3"
                />
                
                {/* Income value label */}
                {item.income > 0 && (
                  <SvgText
                    x={groupX - barWidth - 4 + barWidth / 2}
                    y={incomeY - 5}
                    fontSize="10"
                    fontWeight="600"
                    fill="#4CAF50"
                    textAnchor="middle"
                  >
                    ₹{(item.income / 1000).toFixed(0)}K
                  </SvgText>
                )}
                
                {/* Expense bar */}
                <Rect
                  x={groupX + 4}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  fill="#F44336"
                  rx="3"
                />

                {/* Expense value label */}
                {item.expense > 0 && (
                  <SvgText
                    x={groupX + 4 + barWidth / 2}
                    y={expenseY - 5}
                    fontSize="10"
                    fontWeight="600"
                    fill="#F44336"
                    textAnchor="middle"
                  >
                    ₹{(item.expense / 1000).toFixed(0)}K
                  </SvgText>
                )}

                {/* X-axis label */}
                <SvgText
                  x={groupX}
                  y={height - padding + 22}
                  fontSize="12"
                  fontWeight="600"
                  fill={themeColors.text}
                  textAnchor="middle"
                >
                  {item.label.length > 3 ? item.label.substring(0, 3) : item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendLabel}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendLabel}>Expense</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeColors.surface,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    marginBottom: 15,
    marginHorizontal: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text,
    marginBottom: 20,
  },
  scrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text,
  },
  emptyContainer: {
    backgroundColor: themeColors.surface,
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: themeColors.muted,
  },
});
