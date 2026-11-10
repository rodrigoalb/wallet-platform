import { ProcessedEvents } from './processed-events';

describe('ProcessedEvents', () => {
  it('lembra eventos processados e descarta os mais antigos ao atingir o limite', () => {
    const processed = new ProcessedEvents(2);
    processed.add('a');
    processed.add('b');
    expect(processed.has('a')).toBe(true);

    processed.add('c');
    expect(processed.has('a')).toBe(false);
    expect(processed.has('b')).toBe(true);
    expect(processed.has('c')).toBe(true);
  });
});
