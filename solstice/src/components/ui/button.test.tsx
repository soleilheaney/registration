import { describe, expect, it } from 'vitest';
import { render, screen } from '../../test/utils';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });

  it('applies size class', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toHaveClass('h-9');
  });

  it('renders as child when asChild is true', () => {
    const { container } = render(
      <Button asChild>
        <a href="#">Link Button</a>
      </Button>
    );
    expect(container.querySelector('a')).toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });
});