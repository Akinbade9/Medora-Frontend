import { createContext, useContext } from 'react';
import { Text } from 'react-native';
import { theme } from '../theme';
export const FontReadyContext = createContext(true);
export function AppText({ weight = 'regular', style, ...props }) {
  const ready = useContext(FontReadyContext);
  return (
    <Text
      {...props}
      style={[
        {
          color: theme.colors.text,
          fontSize: theme.fontSize.body,
          lineHeight: 24,
        },
        { fontFamily: ready ? theme.font[weight] : undefined },
        style,
      ]}
    />
  );
}
