import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disputeUrl } from './scan.ts';

test('dispute link targets the issue template with a title', () => {
  assert.equal(
    disputeUrl('skill', 'abc', '@a/b'),
    'https://github.com/Karanjot786/agent-skills-UI/issues/new?template=scan-dispute.yml&title=Scan+dispute%3A+%40a%2Fb+%28skill%2Fabc%29',
  );
});
