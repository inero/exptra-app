import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText
} from 'react-native-svg';
import { colors as themeColors } from '../constants/theme';

interface PremiumSpeedometerProps {
  value: number;
  maxValue: number;
  size?: number;
  title?: string;
  showAnimation?: boolean;
  onStatusChange?: (status: 'safe' | 'caution' | 'alert') => void;
}

export default function PremiumSpeedometer({
  value,
  maxValue,
  size = 340,
  title = 'Monthly Budget',
  showAnimation = true,
  onStatusChange,
}: PremiumSpeedometerProps) {
  const animatedValue = useSharedValue(value);
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);
  const [displayValue, setDisplayValue] = React.useState(value);
  const [displayPercentage, setDisplayPercentage] = React.useState(0);
  const [status, setStatus] = React.useState<'safe' | 'caution' | 'alert'>('safe');

  // Initialize and update animations
  useEffect(() => {
    if (showAnimation) {
      animatedValue.value = withSpring(value, {
        damping: 12,
        mass: 0.8,
        overshootClamping: false,
      });

      scaleAnim.value = withTiming(1.05, { duration: 300 }, (isFinished) => {
        if (isFinished) {
          scaleAnim.value = withTiming(1, { duration: 300 });
        }
      });

      glowAnim.value = withTiming(0.8, { duration: 400 }, (isFinished) => {
        if (isFinished) {
          glowAnim.value = withTiming(0.3, { duration: 400 });
        }
      });
    } else {
      animatedValue.value = value;
      setDisplayValue(value);
    }
  }, [value, showAnimation]);

  // Update display values when animated value changes
  useAnimatedReaction(
    () => animatedValue.value,
    (currentValue) => {
      const clampedValue = Math.min(Math.max(currentValue, 0), maxValue);
      const percent = Math.min(Math.max((clampedValue / Math.max(maxValue, 1)) * 100, 0), 100);
      
      runOnJS(setDisplayValue)(Math.round(clampedValue));
      runOnJS(setDisplayPercentage)(Math.round(percent));

      // Determine status
      let newStatus: 'safe' | 'caution' | 'alert' = 'safe';
      if (percent >= 80) newStatus = 'alert';
      else if (percent >= 50) newStatus = 'caution';

      if (newStatus !== status) {
        runOnJS(setStatus)(newStatus);
        if (onStatusChange) {
          runOnJS(onStatusChange)(newStatus);
        }
      }
    }
  );

  const percentage = displayPercentage;
  const angle = (percentage / 100) * 180;

  // SVG dimensions
  const strokeWidth = size * 0.055;
  const radius = size * 0.32;
  const centerX = size / 2;
  const centerY = size * 0.55;

  // Helper functions
  function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
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
  const valueArc = describeArc(centerX, centerY, radius, 0, angle);

  // Get colors based on status
  const getColors = () => {
    switch (status) {
      case 'safe':
        return {
          primary: '#10B981',
          secondary: '#34D399',
          light: '#D1FAE5',
          glow: 'rgba(16, 185, 129, 0.3)',
        };
      case 'caution':
        return {
          primary: '#F59E0B',
          secondary: '#FBBF24',
          light: '#FEF3C7',
          glow: 'rgba(245, 158, 11, 0.3)',
        };
      case 'alert':
        return {
          primary: '#EF4444',
          secondary: '#F87171',
          light: '#FEE2E2',
          glow: 'rgba(239, 68, 68, 0.3)',
        };
      default:
        return {
          primary: '#10B981',
          secondary: '#34D399',
          light: '#D1FAE5',
          glow: 'rgba(16, 185, 129, 0.3)',
        };
    }
  };

  const colors = getColors();

  // Needle angle
  const needleStartAngle = angle - 90;
  const needleAngle = (needleStartAngle * Math.PI) / 180;
  const needleLength = radius * 0.7;
  const needleX = centerX + needleLength * Math.cos(needleAngle);
  const needleY = centerY + needleLength * Math.sin(needleAngle);

  // Status text
  const getStatusText = () => {
    switch (status) {
      case 'safe':
        return 'Safe to Spend';
      case 'caution':
        return 'Use Wisely';
      case 'alert':
        return 'Limit Approaching';
      default:
        return 'Safe to Spend';
    }
  };

  const remaining = Math.max(0, maxValue - displayValue);
  const remainingPercentage = Math.max(0, 100 - percentage);

  // Animated styles
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <View
          style={[
            styles.percentageBadge,
            { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.percentageText, { color: colors.primary }]}>
            {percentage}%
          </Text>
        </View>
      </View>

      <View style={styles.speedometerWrapper}>
        {/* Glow background */}
        <Animated.View
          style={[
            styles.glowBackground,
            { backgroundColor: colors.glow },
            glowStyle,
          ]}
        />

        {/* Speedometer SVG */}
        <Animated.View style={scaleStyle}>
          <Svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
            <Defs>
              <LinearGradient id={`bg-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.15" />
              </LinearGradient>

              <LinearGradient id={`needle-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8" />
              </LinearGradient>

              <RadialGradient id={`center-${status}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.secondary} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
              </RadialGradient>

              <RadialGradient id={`glow-${status}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Outer glow ring */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius + strokeWidth * 0.8}
              fill={`url(#glow-${status})`}
              opacity={0.6}
            />

            {/* Background arc */}
            <Path
              d={backgroundArc}
              fill="none"
              stroke={`url(#bg-${status})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Value arc */}
            <Path
              d={valueArc}
              fill="none"
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={0.95}
            />

            {/* Inner shadow on value arc */}
            <Path
              d={valueArc}
              fill="none"
              stroke={colors.secondary}
              strokeWidth={strokeWidth * 0.3}
              strokeLinecap="round"
              opacity={0.4}
            />

            {/* Needle shadow */}
            <Path
              d={`M ${centerX + 1.5} ${centerY + 1.5} L ${needleX + 1.5} ${needleY + 1.5}`}
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth={size * 0.016}
              strokeLinecap="round"
            />

            {/* Needle main */}
            <Path
              d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
              stroke={`url(#needle-${status})`}
              strokeWidth={size * 0.014}
              strokeLinecap="round"
            />

            {/* Center glow ring */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={size * 0.058}
              fill="none"
              stroke={colors.primary}
              strokeWidth={size * 0.012}
              opacity={0.3}
            />

            {/* Center pin */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={size * 0.052}
              fill={`url(#center-${status})`}
            />

            {/* Center inner circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={size * 0.028}
              fill={themeColors.surface}
            />

            {/* Speed marks */}
            {[0, 1, 2, 3, 4].map((i) => {
              const markAngle = (i / 4) * 180 - 90;
              const markRadiusOuter = radius + size * 0.04;
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
                  strokeWidth={size * 0.01}
                  opacity={0.5}
                />
              );
            })}

            {/* Scale labels */}
            {[0, 50, 100].map((label, idx) => {
              const labelAngle = (idx / 2) * 180 - 90;
              const labelRadius = radius + size * 0.1;
              const angleRad = (labelAngle * Math.PI) / 180;
              const labelX = centerX + labelRadius * Math.cos(angleRad);
              const labelY = centerY + labelRadius * Math.sin(angleRad);

              return (
                <SvgText
                  key={`label-${label}`}
                  x={labelX}
                  y={labelY}
                  fontSize={size * 0.048}
                  fill={themeColors.muted}
                  textAnchor="middle"
                  opacity={0.6}
                >
                  {label}%
                </SvgText>
              );
            })}

            {/* Current amount */}
            <SvgText
              x={centerX}
              y={centerY + radius * 0.5}
              fontSize={size * 0.15}
              fill={colors.primary}
              textAnchor="middle"
            >
              ₹{displayValue.toLocaleString()}
            </SvgText>

            {/* Max label */}
            <SvgText
              x={centerX}
              y={centerY + radius * 0.75}
              fontSize={size * 0.048}
              fill={themeColors.muted}
              textAnchor="middle"
            >
              of ₹{maxValue.toLocaleString()}
            </SvgText>
          </Svg>
        </Animated.View>
      </View>

      {/* Status indicator */}
      <View
        style={[
          styles.statusContainer,
          { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusMainText, { color: colors.primary }]}>
            {getStatusText()}
          </Text>
          <Text style={[styles.statusSubText, { color: themeColors.muted }]}>
            {percentage < 50
              ? 'Spending is healthy'
              : percentage < 80
              ? 'Monitor your spending'
              : 'Take action soon'}
          </Text>
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailCard}>
          <Text style={[styles.detailLabel, { color: themeColors.muted }]}>Spent</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>
            ₹{displayValue.toLocaleString()}
          </Text>
          <View style={[styles.detailBar, { backgroundColor: colors.light }]}>
            <View
              style={[
                styles.detailBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={[styles.detailLabel, { color: themeColors.muted }]}>Remaining</Text>
          <Text
            style={[
              styles.detailValue,
              { color: remaining > 0 ? colors.primary : '#EF4444' },
            ]}
          >
            ₹{remaining.toLocaleString()}
          </Text>
          <View
            style={[
              styles.detailBar,
              {
                backgroundColor:
                  remaining > 0
                    ? `${colors.light}`
                    : 'rgba(239, 68, 68, 0.15)',
              },
            ]}
          >
            <View
              style={[
                styles.detailBarFill,
                {
                  backgroundColor: remaining > 0 ? colors.primary : '#EF4444',
                  width: `${remainingPercentage}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Footer info */}
      <View style={styles.footerInfo}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: themeColors.muted }]}>Budget Progress</Text>
          <Text style={[styles.infoValue, { color: themeColors.text }]}>
            {percentage.toFixed(1)}% used
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: themeColors.muted }]}>Available</Text>
          <Text
            style={[
              styles.infoValue,
              { color: remaining > 0 ? colors.primary : '#EF4444' },
            ]}
          >
            {remaining > 0 ? `₹${remaining.toLocaleString()}` : 'Over budget'}
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
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  speedometerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    width: '100%',
  },
  glowBackground: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: 20,
    zIndex: -1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusMainText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  detailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footerInfo: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
