import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('fires when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Log meal" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Log meal' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses while saving, so a double tap logs once', async () => {
    const onPress = jest.fn();
    await render(<Button label="Log meal" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Log meal' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Log meal' })).toBeDisabled();
  });
});
