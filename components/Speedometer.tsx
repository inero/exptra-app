import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

interface SpeedometerProps {
  value: number;
  maxValue: number;
  size?: number;
}

export default function Speedometer({ value, maxValue, size = 400 }: SpeedometerProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  const angle = (percentage / 100) * 180;
  
  const radius = size * 0.35;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const startAngle = -180;
  const endAngle = 0;
  
  const backgroundArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
  const valueArc = describeArc(centerX, centerY, radius, startAngle, startAngle + angle);
  
  const needleAngle = (startAngle + angle) * (Math.PI / 180);
  const needleLength = radius * 0.8;
  const needleX = centerX + needleLength * Math.cos(needleAngle);
  const needleY = centerY + needleLength * Math.sin(needleAngle);
  
  const getColor = () => {
    if (percentage < 50) return '#4CAF50';
    if (percentage < 80) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <Path
          d={backgroundArc}
          fill="none"
          stroke="#E0E0E0"
          strokeWidth={size * 0.08}
          strokeLinecap="round"
        />
        
        <Path
          d={valueArc}
          fill="none"
          stroke={getColor()}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
        />
        
        <Path
          d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
          stroke="#333"
          strokeWidth={size * 0.01}
          strokeLinecap="round"
        />
        
        <Circle
          cx={centerX}
          cy={centerY}
          r={size * 0.04}
          fill="#333"
        />
        
        <SvgText
          x={centerX}
          y={centerY + radius * 0.6}
          fontSize={size * 0.12}
          fill="#333"
          textAnchor="middle"
          fontWeight="bold"
        >
          ₹{value.toLocaleString()}
        </SvgText>
        
        <SvgText
          x={centerX}
          y={centerY + radius * 0.8}
          fontSize={size * 0.08}
          fill="#666"
          textAnchor="middle"
        >
          of ₹{maxValue.toLocaleString()}
        </SvgText>
      </Svg>
    </View>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
  return d;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
