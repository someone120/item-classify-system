import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ItemDialog from '../ItemDialog';
import * as api from '../../../utils/api';

vi.mock('../../../utils/api', () => ({
  getLocations: vi.fn(),
}));

it('loads locations and submits trimmed input', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue(undefined);
  const getLocations = vi.mocked(api.getLocations);
  getLocations.mockResolvedValue([
    {
      id: 1,
      name: 'A1',
      parent_id: null,
      location_type: 'box',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ]);

  render(<ItemDialog open item={null} onClose={vi.fn()} onSave={onSave} />);

  await waitFor(() => expect(getLocations).toHaveBeenCalledTimes(1));
  await user.type(screen.getByLabelText(/物品名称/), '  电阻  ');
  await user.clear(screen.getByLabelText(/数量/));
  await user.type(screen.getByLabelText(/数量/), '5');
  await user.click(screen.getByRole('button', { name: '保存' }));

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      name: '电阻',
      quantity: 5,
    })
  );
});
