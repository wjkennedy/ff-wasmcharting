import test from 'node:test';
import assert from 'node:assert/strict';
import { composeScopedJql, splitOrderBy } from '../src/lib/work-fetch.js';

test('splitOrderBy separates where and order section', () => {
  const parts = splitOrderBy('assignee = currentUser() ORDER BY updated DESC');
  assert.equal(parts.where, 'assignee = currentUser()');
  assert.equal(parts.orderBy, 'ORDER BY updated DESC');
});

test('composeScopedJql preserves ORDER BY and scopes to project/time', () => {
  const jql = composeScopedJql('assignee = currentUser() ORDER BY updated DESC', 'AYB', 90);
  assert.equal(
    jql,
    'project = "AYB" AND (assignee = currentUser()) AND updated >= -90d ORDER BY updated DESC'
  );
});
