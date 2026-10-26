import { Text, View } from 'react-native';

import { makeStyles, useTheme } from '../hooks/useTheme';
import { typography } from '../theme';

type Props = {
  name: string;
};

export default function NameTag({ name }: Props) {
  const { shadows } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.tag, shadows.soft]}>
      <Text style={styles.text} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  tag: {
    maxWidth: 136,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.subtitle,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    color: colors.text,
  },
}));
