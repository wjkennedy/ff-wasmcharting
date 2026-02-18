import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFlowAggregate,
  hashKey,
  pickStatusGroup
} from '../src/lib/aggregates.js';

test('pickStatusGroup uses configured groups', () => {
  const group = pickStatusGroup('In Progress', {
    backlog: ['To Do'],
    inProgress: ['In Progress'],
    done: ['Done']
  });
  assert.equal(group, 'inProgress');
});

test('buildFlowAggregate counts by status group', () => {
  const result = buildFlowAggregate([
    { fields: { status: { name: 'To Do' } } },
    { fields: { status: { name: 'In Progress' } } },
    { fields: { status: { name: 'Done' } } }
  ], {
    backlog: ['To Do'],
    inProgress: ['In Progress'],
    done: ['Done']
  });
  assert.equal(result.totalIssues, 3);
  assert.equal(result.buckets.backlog, 1);
  assert.equal(result.buckets.inProgress, 1);
  assert.equal(result.buckets.done, 1);
});

test('hashKey is stable for same input', () => {
  const one = hashKey('abc');
  const two = hashKey('abc');
  assert.equal(one, two);
});
