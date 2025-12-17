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
  Stop
} from 'react-native-svg';
import { colors as themeColors } from '../constants/theme';

interface ImprovedSpeedometerProps {
  value: number;
  maxValue: number;
  size?: number;
  title?: string;
  showAnimation?: boolean;
  onStatusChange?: (status: 'safe' | 'caution' | 'alert') => void;
}

export default function ImprovedSpeedometer({
  value,
  maxValue,
  size = 300,
  title = 'Monthly Budget',
  showAnimation = true,
  onStatusChange,
}: ImprovedSpeedometerProps) {
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

  // Fixed SVG dimensions - simplified for proper alignment
  const svgSize = 280;
  const svgHeight = 180;
  const centerX = svgSize / 2;
  const centerY = svgHeight - 20;
  const arcRadius = 100;
  const strokeWidth = 14;

  // Color system
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

  // Arc generation
  function getArcPath(startAngle: number, endAngle: number): string {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + arcRadius * Math.cos(startRad);
    const y1 = centerY + arcRadius * Math.sin(startRad);
    const x2 = centerX + arcRadius * Math.cos(endRad);
    const y2 = centerY + arcRadius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const backgroundArcPath = getArcPath(-180, 0);
  const valueArcPath = getArcPath(-180, -180 + angle);

  // Needle position
  const needleAngle = -180 + angle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = arcRadius * 0.8;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

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
    marginTop: -66
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

        {/* Main speedometer SVG */}
        <Animated.View style={scaleStyle}>
          <Svg width={svgSize} height={svgHeight} viewBox={`0 0 ${svgSize} ${svgHeight}`}>
            <Defs>
              <LinearGradient id={`bgGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
              </LinearGradient>

              <LinearGradient id={`needleGrad-${status}`} x1="50%" y1="0%" x2="50%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8" />
              </LinearGradient>

              <RadialGradient id={`centerGrad-${status}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.secondary} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
              </RadialGradient>
            </Defs>

            {/* Background arc */}
            <Path
              d={backgroundArcPath}
              fill="none"
              stroke={`url(#bgGrad-${status})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Value arc */}
            <Path
              d={valueArcPath}
              fill="none"
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Needle shadow */}
            <Path
              d={`M ${centerX + 1} ${centerY + 1} L ${needleX + 1} ${needleY + 1}`}
              stroke="rgba(0, 0, 0, 0.2)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Needle */}
            <Path
              d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
              stroke={`url(#needleGrad-${status})`}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Center pin */}
            <Circle
              cx={centerX}
              cy={centerY}
              r="8"
              fill={`url(#centerGrad-${status})`}
            />

            {/* Center inner circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r="4"
              fill={themeColors.surface}
            />

            {/* Percentage markers */}
            {[0, 25, 50, 75, 100].map((markerPercent) => {
              const markerAngle = (-180 + (markerPercent / 100) * 180) * (Math.PI / 180);
              const markerRadiusOuter = arcRadius + 8;
              const markerRadiusInner = arcRadius - 8;
              const x1 = centerX + markerRadiusInner * Math.cos(markerAngle);
              const y1 = centerY + markerRadiusInner * Math.sin(markerAngle);
              const x2 = centerX + markerRadiusOuter * Math.cos(markerAngle);
              const y2 = centerY + markerRadiusOuter * Math.sin(markerAngle);

              return (
                <Path
                  key={`mark-${markerPercent}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={themeColors.onSurfaceVariant}
                  strokeWidth="2"
                  opacity={0.5}
                />
              );
            })}

            {/* Percentage labels */}
            {/* {[0, 50, 100].map((labelPercent) => {
              const labelAngle = (-180 + (labelPercent / 100) * 180) * (Math.PI / 180);
              const labelRadius = arcRadius + 28;
              const labelX = centerX + labelRadius * Math.cos(labelAngle);
              const labelY = centerY + labelRadius * Math.sin(labelAngle);

              return (
                <SvgText
                  key={`label-${labelPercent}`}
                  x={labelX}
                  y={labelY + 2}
                  fontSize="12"
                  fill={themeColors.muted}
                  textAnchor="middle"
                >
                  {labelPercent}
                </SvgText>
              );
            })} */}

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
        {/* <View style={[styles.statusDot, { backgroundColor: colors.primary }]} /> */}
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
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
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
    fontSize: 12,
    fontWeight: '700',
  },
  speedometerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  glowBackground: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -30,
    zIndex: -1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    width: '65%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    marginTop: -15,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
    alignContent: 'center',
    alignItems: 'center'
  },
  statusMainText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
    width: '100%',
    marginTop: 22,
  },
  detailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  footerInfo: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
