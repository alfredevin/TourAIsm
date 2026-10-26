import { Pressable, Text, View } from 'react-native';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import { radius } from '../../theme';

type Action = {
  label: string;
  onPress: () => void;
};

type Props = {
  message: string;
  actions: Action[];
};

export default function NoticeBanner({ message, actions }: Props) {
  const { shadows } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.banner, shadows.card]}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable key={action.label} hitSlop={8} onPress={action.onPress}>
            <Text style={styles.action}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  banner: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
}));
