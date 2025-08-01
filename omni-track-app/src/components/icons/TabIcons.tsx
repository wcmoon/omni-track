import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

interface TabIconProps {
  focused?: boolean;
  color?: string;
  size?: number;
}

export const DashboardIcon: React.FC<TabIconProps> = ({ focused, color = '#8E8E93', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect 
      x="3" 
      y="3" 
      width="7" 
      height="7" 
      rx="1" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Rect 
      x="14" 
      y="3" 
      width="7" 
      height="7" 
      rx="1" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Rect 
      x="3" 
      y="14" 
      width="7" 
      height="7" 
      rx="1" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Rect 
      x="14" 
      y="14" 
      width="7" 
      height="7" 
      rx="1" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
  </Svg>
);

export const TasksIcon: React.FC<TabIconProps> = ({ focused, color = '#8E8E93', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
  </Svg>
);

export const LogsIcon: React.FC<TabIconProps> = ({ focused, color = '#8E8E93', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Path 
      d="M14 2V8H20" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Line 
      x1="16" 
      y1="13" 
      x2="8" 
      y2="13" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round"
    />
    <Line 
      x1="16" 
      y1="17" 
      x2="8" 
      y2="17" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round"
    />
    <Line 
      x1="10" 
      y1="9" 
      x2="8" 
      y2="9" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round"
    />
  </Svg>
);

export const ProfileIcon: React.FC<TabIconProps> = ({ focused, color = '#8E8E93', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.05 : 0}
    />
    <Circle 
      cx="12" 
      cy="7" 
      r="4" 
      stroke={color} 
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : 'none'}
      fillOpacity={focused ? 0.1 : 0}
    />
  </Svg>
);