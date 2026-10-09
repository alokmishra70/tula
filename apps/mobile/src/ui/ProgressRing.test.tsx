import { render, screen } from '@testing-library/react-native';
import { ProgressRing } from './ProgressRing';
import { Text } from './Text';

describe('ProgressRing', () => {
  it('describes progress for screen readers', async () => {
    await render(
      <ProgressRing consumed={1240} target={1850}>
        <Text>610</Text>
      </ProgressRing>,
    );
    expect(screen.getByLabelText('1,240 of 1,850 kilocalories eaten')).toBeTruthy();
    expect(screen.getByText('610')).toBeTruthy();
  });
});
