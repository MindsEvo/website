'use strict';

/**
 * Spatial Pattern Hunter — Route Scout Sample (Shell-1 format)
 *
 * Adaptation principle:
 * Keep planning + spatial reasoning value,
 * remove heavy animation/physics complexity.
 *
 * Legend:
 * S = start, G = goal, # = wall, . = walkable
 * Route code letters: U D L R
 */

var SPATIAL_DATA = {
  units: [
    {
      id: 'route-l1',
      levelId: 'L1',
      spatialType: 'route_planning',
      difficultyAxis: {
        object_complexity: 'concrete',
        dimension_complexity: 'single',
        relation_complexity: 'direct',
        language_complexity: 'question',
        transfer_complexity: 'within-domain'
      },
      icon: '1️⃣',
      nameZh: 'L1 · 单步路径',
      nameEn: 'L1 · Basic Route',
      descZh: '短路径，障碍少，先建立方向判断。',
      descEn: 'Short routes with few blockers to build direction judgment.',
      questions: [
        {
          map: ['S..', '.##', '..G'],
          answer: 'DDRR',
          options: ['DDRR', 'RRDD', 'DRRD', 'RDDR'],
          hintZh: '右下角通路被墙切开，先向下绕行。',
          hintEn: 'Walls split the right-down area, so go down first and detour.'
        },
        {
          map: ['S#.', '..#', '..G'],
          answer: 'DDRR',
          options: ['DDRR', 'DRRD', 'RRDD', 'DRUR'],
          hintZh: '起点右边是墙，只能向下开路。',
          hintEn: 'A wall blocks the right side at start, so open path downward.'
        },
        {
          map: ['S..', '##.', '..G'],
          answer: 'RRDD',
          options: ['RRDD', 'RDRD', 'DDRR', 'RDDL'],
          hintZh: '第二行左侧封死，只能先走右边。',
          hintEn: 'Left side of row 2 is blocked, so move right side first.'
        },
        {
          map: ['S..', '.#G', '...'],
          answer: 'RRD',
          options: ['RRD', 'RDR', 'DRR', 'RDD'],
          hintZh: '终点在右上区域，先到最右再下。',
          hintEn: 'Goal is in the upper-right area: go far right, then down.'
        }
      ]
    },
    {
      id: 'route-l2',
      levelId: 'L2',
      spatialType: 'route_planning',
      difficultyAxis: {
        object_complexity: 'concrete',
        dimension_complexity: 'single',
        relation_complexity: 'chain',
        language_complexity: 'question',
        transfer_complexity: 'within-domain'
      },
      icon: '2️⃣',
      nameZh: 'L2 · 双步规划',
      nameEn: 'L2 · Two-step Planning',
      descZh: '路径更长，需提前两步避开死路。',
      descEn: 'Longer routes requiring two-step lookahead to avoid dead ends.',
      questions: [
        {
          map: ['S..#', '##.#', '...#', '#..G'],
          answer: 'RRDDDR',
          options: ['RRDDDR', 'RRDDRD', 'RRDRDD', 'RDRDDR'],
          hintZh: '起点只能向右推进，之后沿右侧下行。',
          hintEn: 'Start can only move right first, then descend along the right lane.'
        },
        {
          map: ['S.#.', '.#..', '.##.', '...G'],
          answer: 'DDDRRR',
          options: ['DDDRRR', 'DRRDRR', 'RRDDRR', 'DDRDRR'],
          hintZh: '中部有竖向封锁，先到底再横向移动。',
          hintEn: 'A vertical block in the middle means go to bottom first, then move across.'
        },
        {
          map: ['S..#', '##..', '..#.', '.#G.'],
          answer: 'RRDRDDL',
          options: ['RRDRDDL', 'RRDDDRL', 'DDRRRDL', 'RRDRRDL'],
          hintZh: '先走右上通道，再下探后回左到终点。',
          hintEn: 'Take the upper-right corridor, then go down and return left to goal.'
        },
        {
          map: ['S#..', '.#.#', '...#', '##.G'],
          answer: 'DDRRDR',
          options: ['DDRRDR', 'DDRDRR', 'DRDRRR', 'RRDDDR'],
          hintZh: '起点右侧封闭，先穿过下方通路再折向终点。',
          hintEn: 'Right side at start is blocked; pass through lower lane before turning to goal.'
        }
      ]
    },
    {
      id: 'route-l3',
      levelId: 'L3',
      spatialType: 'route_planning',
      difficultyAxis: {
        object_complexity: 'concrete',
        dimension_complexity: 'single',
        relation_complexity: 'constrained',
        language_complexity: 'question',
        transfer_complexity: 'strategy'
      },
      icon: '3️⃣',
      nameZh: 'L3 · 干扰路径',
      nameEn: 'L3 · Distractor Routes',
      descZh: '增加迷惑选项，训练稳定的空间推理。',
      descEn: 'Adds distractor routes to train stable spatial reasoning.',
      questions: [
        {
          map: ['S....', '###..', '...#.', '.#.#.', '.#..G'],
          answer: 'RRRRDDDD',
          options: ['RRRRDDDD', 'RRRDDDDD', 'DDRRRRDD', 'RRRRDDDR'],
          hintZh: '第二行几乎封死，先在顶行走到最右。',
          hintEn: 'Row 2 is mostly blocked, so traverse to far right on top row first.'
        },
        {
          map: ['S#...', '.#.#.', '.#.#G', '.#.#.', '.....'],
          answer: 'DDDDRRRRUU',
          options: ['DDDDRRRRUU', 'DDDRRRRUU', 'RRDDDDRRUU', 'DDDDRRRUUU'],
          hintZh: '中段竖墙连续，必须到底后再右移并上行。',
          hintEn: 'Continuous middle walls force you to bottom first, then move right and go up.'
        },
        {
          map: ['S....', '.###.', '....#', '.####', 'G....'],
          answer: 'DDDD',
          options: ['DDDD', 'RRRRDDDD', 'DDRRDD', 'DRDD'],
          hintZh: '右侧是伪通道，真正可达路线在最左列。',
          hintEn: 'Right side is a fake corridor; only the left column reaches goal.'
        },
        {
          map: ['S..#.', '.#.#.', '.#.#.', '.#...', '...#G'],
          answer: 'RRDDDRRD',
          options: ['RRDDDRRD', 'DDRRRRDD', 'RRDDRDRD', 'RRDDDRDR'],
          hintZh: '先沿上方开口进入中线，再向右下收尾。',
          hintEn: 'Enter through the top opening into the middle lane, then finish at lower-right.'
        }
      ]
    }
  ]
};
