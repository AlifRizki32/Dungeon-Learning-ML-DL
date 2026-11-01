import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLearningContext,
  getSuggestedQuestionsForContext,
  parseMarkdownBlocks,
} from './chatService.ts';
import { DUNGEON_3D_ZONES, DUNGEON_3D_ZONE_LIST } from '../Dungeon3D/sceneConfig.ts';

describe('AI Dungeon Mentor & 3D Scene Pure Logic', () => {
  it('resolves Floor 1 context accurately from roadmap', () => {
    const ctx = resolveLearningContext({
      currentView: 'dungeon',
      activeFloorId: 1,
      activeNodeByFloor: { 1: 'topic-3' },
      selectedTopicId: 'topic-3',
      scrollOnlyTopicId: null,
      selectedBossFloorId: null,
      completedRooms: ['topic-1', 'topic-2'],
      defeatedBosses: [],
      specialization: null,
      xp: 350,
    });

    assert.equal(ctx.floorNumber, 1);
    assert.ok(ctx.floorTitle.includes('Katakomba Fondasi'));
    assert.equal(ctx.topicId, 'topic-3');
    assert.ok(ctx.topicName?.includes('Statistik inferensial'));
    assert.ok((ctx.topicScope?.length || 0) > 10);
    assert.ok((ctx.understandingSign?.length || 0) > 10);
  });

  it('resolves Floor 6 Menara Master context when viewing tower', () => {
    const ctx = resolveLearningContext({
      currentView: 'tower',
      activeFloorId: 1,
      activeNodeByFloor: {},
      selectedTopicId: null,
      scrollOnlyTopicId: null,
      selectedBossFloorId: null,
      completedRooms: [],
      defeatedBosses: ['boss-1', 'boss-2', 'boss-3', 'boss-4', 'boss-5'],
      specialization: 'TinyML & IoT',
      xp: 5000,
    });

    assert.equal(ctx.floorNumber, 6);
    assert.ok(ctx.floorTitle.includes('Menara Master'));
    assert.equal(ctx.isTowerView, true);
    assert.ok(ctx.topicName?.includes('TinyML & IoT'));
  });

  it('generates Indonesian suggested questions for the active topic', () => {
    const ctx = resolveLearningContext({
      currentView: 'dungeon',
      activeFloorId: 2,
      activeNodeByFloor: { 2: 'topic-7' },
      selectedTopicId: 'topic-7',
      scrollOnlyTopicId: null,
      selectedBossFloorId: null,
      completedRooms: ['topic-1', 'topic-2', 'topic-3', 'topic-4', 'topic-5', 'topic-6'],
      defeatedBosses: ['boss-1'],
      specialization: null,
      xp: 1200,
    });

    const suggestions = getSuggestedQuestionsForContext(ctx);
    assert.equal(suggestions.length, 4);
    assert.ok(ctx.topicName && suggestions[0].includes(ctx.topicName));
    assert.ok(suggestions.some((s) => s.includes('Python')));
  });

  it('parses markdown text and fenced Python code blocks accurately', () => {
    const sample = [
      'Berikut contoh implementasi sederhana:',
      '```python',
      'import numpy as np',
      'x = np.array([1, 2, 3])',
      'print(x.mean())',
      '```',
      'Semoga membantu petualanganmu!',
    ].join('\n');

    const blocks = parseMarkdownBlocks(sample);
    assert.equal(blocks.length, 3);
    assert.equal(blocks[0].type, 'paragraph');
    assert.equal(blocks[1].type, 'code');
    assert.equal(blocks[1].language, 'python');
    assert.ok(blocks[1].content.includes('import numpy as np'));
    assert.equal(blocks[2].type, 'paragraph');
  });

  it('defines all 5 interactive 3D Dungeon camera zones with valid 3D coordinates', () => {
    assert.equal(DUNGEON_3D_ZONE_LIST.length, 5);
    for (const zone of DUNGEON_3D_ZONE_LIST) {
      assert.ok(DUNGEON_3D_ZONES[zone.id]);
      assert.equal(zone.cameraPosition.length, 3);
      assert.equal(zone.cameraTarget.length, 3);
      assert.ok(zone.title.length > 5);
      assert.ok(zone.description.length > 20);
    }
  });
});
