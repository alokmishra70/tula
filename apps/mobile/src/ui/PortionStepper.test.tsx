import { fireEvent, render, screen } from '@testing-library/react-native';
import { formatQuantity, PortionStepper, unitLabel } from './PortionStepper';

describe('PortionStepper', () => {
  it('formats half steps with Indian units', () => {
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2)).toBe('2');
    expect(unitLabel('katori', 2)).toBe('katoris');
    expect(unitLabel('roti', 1)).toBe('roti');
  });

  it('steps by half a unit and stops at the minimum', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(
      <PortionStepper value={1} unit="katori" onChange={onChange} itemName="Dal" />,
    );
    await fireEvent.press(screen.getByLabelText('More Dal'));
    expect(onChange).toHaveBeenLastCalledWith(1.5);

    await rerender(<PortionStepper value={0.5} unit="katori" onChange={onChange} itemName="Dal" />);
    onChange.mockClear();
    await fireEvent.press(screen.getByLabelText('Less Dal'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
