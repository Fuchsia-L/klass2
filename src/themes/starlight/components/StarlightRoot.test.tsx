import type { StarlightEvent } from './starlightTypes';
import { withState } from './StarlightRoot';

function makeEvent(id: string, start_time: string, end_time: string): StarlightEvent {
  return {
    id,
    title: id,
    category: '学习',
    start_time,
    end_time,
    repeat: 'none',
    is_completed: false,
    state: 'upcoming',
  };
}

describe('StarlightRoot withState', () => {
  it('marks running and start-at-now events as now; future as next', () => {
    const nowMs = new Date('2026-04-20T10:00:00.000Z').getTime();

    const events = [
      makeEvent('past', '2026-04-20T08:00:00.000Z', '2026-04-20T09:00:00.000Z'),
      makeEvent('running', '2026-04-20T09:30:00.000Z', '2026-04-20T10:30:00.000Z'),
      makeEvent('starts-now', '2026-04-20T10:00:00.000Z', '2026-04-20T11:00:00.000Z'),
      makeEvent('future', '2026-04-20T11:30:00.000Z', '2026-04-20T12:30:00.000Z'),
    ];

    expect(withState(events, nowMs).map((event) => [event.id, event.state])).toEqual([
      ['past', 'past'],
      ['running', 'now'],
      ['starts-now', 'now'],
      ['future', 'next'],
    ]);
  });

  it('marks an ongoing event as now and the next future as next', () => {
    const nowMs = new Date('2026-04-20T10:00:00.000Z').getTime();

    const events = [
      makeEvent('running', '2026-04-20T09:30:00.000Z', '2026-04-20T10:30:00.000Z'),
      makeEvent('future', '2026-04-20T11:30:00.000Z', '2026-04-20T12:30:00.000Z'),
    ];

    expect(withState(events, nowMs).map((event) => [event.id, event.state])).toEqual([
      ['running', 'now'],
      ['future', 'next'],
    ]);
  });

  it('keeps end-time-before-now as past and end-time-equal-now as upcoming', () => {
    const nowMs = new Date('2026-04-20T10:00:00.000Z').getTime();

    const events = [
      makeEvent('ended-before-now', '2026-04-20T08:00:00.000Z', '2026-04-20T09:59:59.999Z'),
      makeEvent('ends-at-now', '2026-04-20T09:00:00.000Z', '2026-04-20T10:00:00.000Z'),
    ];

    expect(withState(events, nowMs).map((event) => [event.id, event.state])).toEqual([
      ['ended-before-now', 'past'],
      ['ends-at-now', 'upcoming'],
    ]);
  });
});
