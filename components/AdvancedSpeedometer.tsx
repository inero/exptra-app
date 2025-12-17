import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors as themeColors } from '../constants/theme';

interface AdvancedSpeedometerProps {
  value: number;
  maxValue: number;
  size?: number;
  title?: string;
  showAnimation?: boolean;
}

export default function AdvancedSpeedometer({
  value,
  maxValue,
  size = 320,
  title = 'Budget Status',
  showAnimation = true,
}: AdvancedSpeedometerProps) {
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    if (showAnimation) {
      animatedValue.value = withSpring(value, {
        damping: 10,
        mass: 1,
        overshootClamping: false,
      });
    } else {
      animatedValue.value = value;
    }
  }, [value, showAnimation]);

  const percentage = Math.min(Math.max((animatedValue.value / Math.max(maxValue, 1)) * 100, 0), 100);
  
  // Calculate angle (0 to 180 degrees)
  const animatedAngle = interpolate(
    animatedValue.value,
    [0, maxValue],
    [0, 180],
    'clamp'
  );
  
  const radius = size * 0.35;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = size * 0.06;
  
  // Color zones for gradient
  const getColorByPercentage = (percent: number) => {
    if (percent < 50) return { start: '#10B981', end: '#34D399' }; // Green
    if (percent < 80) return { start: '#F59E0B', end: '#FBBF24' }; // Yellow/Orange
    return { start: '#EF4444', end: '#F87171' }; // Red
  };

  const colorZone = getColorByPercentage(percentage);

  // Generate arc path
  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleInDegrees: number
  ) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  }

  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
    return d;
  }

  const backgroundArc = describeArc(centerX, centerY, radius, 0, 180);
  const valueArc = describeArc(centerX, centerY, radius, 0, animatedAngle);

  // Animated text values
  const AnimatedText = Animated.createAnimatedComponent(SvgText);

  const animatedDisplayValue = interpolate(
    animatedValue.value,
    [0, maxValue],
    [0, value],
    'clamp'
  );

  // Status text based on percentage
  const getStatusText = () => {
    if (percentage < 50) return 'Safe';
    if (percentage < 80) return 'Caution';
    return 'Alert';
  };

  const getStatusColor = () => {
    if (percentage < 50) return '#10B981';
    if (percentage < 80) return '#F59E0B';
    return '#EF4444';
  };

  // Needle angle calculation
  const needleStartAngle = animatedAngle - 90;
  const needleAngle = (needleStartAngle * Math.PI) / 180;
  const needleLength = radius * 0.75;
  const needleX = centerX + needleLength * Math.cos(needleAngle);
  const needleY = centerY + needleLength * Math.sin(needleAngle);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      
      <View style={styles.speedometerWrapper}>
        <Svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
          <Defs>
            <LinearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background track with gradient */}
          <Path
            d={backgroundArc}
            fill="none"
            stroke="url(#speedGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />

          {/* Value track with dynamic gradient */}
          <Path
            d={valueArc}
            fill="none"
            stroke={colorZone.start}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.9}
          />

          {/* Glowing effect circle around needle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.12}
            fill={getStatusColor()}
            opacity={0.15}
          />

          {/* Needle */}
          <G>
            {/* Needle shadow */}
            <Path
              d={`M ${centerX} ${centerY} L ${needleX + 1} ${needleY + 1}`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={size * 0.015}
              strokeLinecap="round"
            />
            {/* Needle main */}
            <Path
              d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
              stroke={colorZone.start}
              strokeWidth={size * 0.012}
              strokeLinecap="round"
            />
          </G>

          {/* Center pin with gradient effect */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.045}
            fill={themeColors.surface}
            stroke={colorZone.start}
            strokeWidth={size * 0.008}
          />

          {/* Center inner circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.025}
            fill={colorZone.start}
          />

          {/* Speed marks */}
          {[0, 1, 2, 3, 4].map((i) => {
            const markAngle = (i / 4) * 180 - 90;
            const markRadiusOuter = radius + size * 0.03;
            const markRadiusInner = radius - size * 0.01;

            const angleRad = (markAngle * Math.PI) / 180;
            const x1 = centerX + markRadiusInner * Math.cos(angleRad);
            const y1 = centerY + markRadiusInner * Math.sin(angleRad);
            const x2 = centerX + markRadiusOuter * Math.cos(angleRad);
            const y2 = centerY + markRadiusOuter * Math.sin(angleRad);

            return (
              <Path
                key={`mark-${i}`}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={themeColors.onSurfaceVariant}
                strokeWidth={size * 0.008}
                opacity={0.4}
              />
            );
          })}

          {/* Scale labels */}
          {[0, 50, 100].map((label, idx) => {
            const labelAngle = (idx / 2) * 180 - 90;
            const labelRadius = radius + size * 0.08;
            const angleRad = (labelAngle * Math.PI) / 180;
            const labelX = centerX + labelRadius * Math.cos(angleRad);
            const labelY = centerY + labelRadius * Math.sin(angleRad);

            return (
              <SvgText
                key={`label-${label}`}
                x={labelX}
                y={labelY}
                fontSize={size * 0.05}
                fill={themeColors.muted}
                textAnchor="middle"
                opacity={0.6}
              >
                {label}%
              </SvgText>
            );
          })}

          {/* Current amount value */}
          <SvgText
            x={centerX}
            y={centerY + radius * 0.55}
            fontSize={size * 0.14}
            fill={themeColors.text}
            textAnchor="middle"
            fontWeight="800"
          >
            ₹{Math.floor(animatedDisplayValue).toLocaleString()}
          </SvgText>

          {/* Max amount label */}
          <SvgText
            x={centerX}
            y={centerY + radius * 0.8}
            fontSize={size * 0.05}
            fill={themeColors.muted}
            textAnchor="middle"
            opacity={0.7}
          >
            of ₹{maxValue.toLocaleString()}
          </SvgText>

          {/* Percentage display */}
          <SvgText
            x={centerX}
            y={centerY + radius * 1}
            fontSize={size * 0.06}
            fill={getStatusColor()}
            textAnchor="middle"
            fontWeight="700"
          >
            {Math.floor(percentage)}%
          </SvgText>
        </Svg>
      </View>

      {/* Status indicator below */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor() },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            { color: getStatusColor() },
          ]}
        >
          {getStatusText()} - {percentage < 50 ? 'Safe to spend' : percentage < 80 ? 'Use wisely' : 'Budget limit approaching'}
        </Text>
      </View>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: themeColors.muted }]}>Spent</Text>
          <Text style={[styles.detailValue, { color: themeColors.text }]}>
            ₹{Math.floor(animatedDisplayValue).toLocaleString()}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: themeColors.muted }]}>Remaining</Text>
          <Text style={[styles.detailValue, { color: getStatusColor() }]}>
            ₹{Math.max(0, maxValue - Math.floor(animatedDisplayValue)).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  speedometerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 16,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
