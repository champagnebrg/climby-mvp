import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCompetitionLiveEntryPayload,
  computeCompetitionLiveEntryScore,
  normalizeCompletedBlockNumbers,
  normalizeCompetitionLive,
  normalizeCompetitionLiveBlocksCount,
  normalizeCompetitionLiveEntryRecord,
} from '../src/features/events/index.js';

test('normalizeCompetitionLiveBlocksCount accepts only non-negative integers', () => {
  assert.equal(normalizeCompetitionLiveBlocksCount(12), 12);
  assert.equal(normalizeCompetitionLiveBlocksCount('7'), 7);
  assert.equal(normalizeCompetitionLiveBlocksCount('7.2'), 0);
  assert.equal(normalizeCompetitionLiveBlocksCount(-1), 0);
  assert.equal(normalizeCompetitionLiveBlocksCount('abc'), 0);
});

test('normalizeCompetitionLive keeps legacy fields and normalizes blocksCount', () => {
  const result = normalizeCompetitionLive({
    enabled: true,
    status: 'live',
    blocksCount: '15',
    sectorIds: ['a', 'a', 'b'],
    routeSelectionMode: 'manual',
  });

  assert.deepEqual(result, {
    enabled: true,
    status: 'live',
    blocksCount: 15,
    format: '',
    label: '',
    startsAt: null,
    endsAt: null,
    notes: '',
    sectorIds: ['a', 'b'],
    routeSelectionMode: 'manual',
    updatedAt: null,
  });
});

test('normalizeCompletedBlockNumbers returns sorted unique positive integers only', () => {
  assert.deepEqual(normalizeCompletedBlockNumbers([4, '1', 4, 2, 0, -1, 'x', 2.9]), [1, 2, 4]);
  assert.deepEqual(normalizeCompletedBlockNumbers([3.1, '5.5', 6]), [6]);
});

test('computeCompetitionLiveEntryScore prefers completed blocks over legacy routes and fallback score', () => {
  assert.equal(computeCompetitionLiveEntryScore({
    completedBlockNumbers: [1, 2, 3],
    completedRouteIds: ['r1', 'r2'],
    fallbackScore: 99,
  }), 3);

  assert.equal(computeCompetitionLiveEntryScore({
    completedBlockNumbers: [],
    completedRouteIds: ['r1', 'r2'],
    fallbackScore: 99,
  }), 2);

  assert.equal(computeCompetitionLiveEntryScore({
    completedBlockNumbers: [],
    completedRouteIds: [],
    fallbackScore: 7,
  }), 7);
});

test('buildCompetitionLiveEntryPayload computes score from completedBlockNumbers and keeps legacy fields', () => {
  const result = buildCompetitionLiveEntryPayload({
    gymId: 'g',
    eventId: 'e',
    userId: 'u',
    completedBlockNumbers: [3, '2', 2, 1],
    completedRouteIds: ['route-1'],
    completedBySector: { sectorA: ['route-1'] },
  }, {
    now: new Date('2026-03-22T00:00:00.000Z'),
  });

  assert.equal(result.score, 3);
  assert.deepEqual(result.completedBlockNumbers, [1, 2, 3]);
  assert.deepEqual(result.completedRouteIds, ['route-1']);
  assert.deepEqual(result.completedBySector, { sectorA: ['route-1'] });
});


test('buildCompetitionLiveEntryPayload preserves readable user identity fields', () => {
  const result = buildCompetitionLiveEntryPayload({
    gymId: 'g',
    eventId: 'e',
    userId: 'u',
    displayName: 'Mario Rossi',
    username: 'mario',
    firstName: 'Mario',
    lastName: 'Rossi',
    completedBlockNumbers: [1],
  }, {
    now: new Date('2026-03-22T00:00:00.000Z'),
  });

  assert.equal(result.displayName, 'Mario Rossi');
  assert.equal(result.username, 'mario');
  assert.equal(result.firstName, 'Mario');
  assert.equal(result.lastName, 'Rossi');
});

test('normalizeCompetitionLiveEntryRecord falls back to legacy route-based score when blocks are absent', () => {
  const result = normalizeCompetitionLiveEntryRecord('u', {
    gymId: 'g',
    eventId: 'e',
    userId: 'u',
    completedRouteIds: ['route-1', 'route-2'],
  });

  assert.equal(result.score, 2);
  assert.deepEqual(result.completedBlockNumbers, []);
});
