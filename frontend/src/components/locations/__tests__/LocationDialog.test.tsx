import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LocationDialog from '../LocationDialog';

it('saves trimmed name and optional parent_id', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue(undefined);

  render(
    <LocationDialog
      open
      location={null}
      parentId={3}
      onClose={vi.fn()}
      onSave={onSave}
    />
  );

  await user.type(screen.getByLabelText('位置名称'), '  测试位置  ');
  await user.click(screen.getByRole('button', { name: '保存' }));

  expect(onSave).toHaveBeenCalledWith({
    name: '测试位置',
    location_type: 'box',
    description: undefined,
    parent_id: 3,
  });
});
