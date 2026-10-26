import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { makeStyles } from '../../hooks/useTheme';


type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
}));
