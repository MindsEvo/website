window.ChessClassicGames = {
  "g1": {
    "meta": {
      "id": "G1_fools_mate",
      "sequence": 1,
      "type": "classic_game_demo",
      "difficulty": "L0_intro",
      "name_en": "Fool's Mate",
      "name_cn": "经典棋局 - 傻瓜将杀",
      "players": "（假设对局）",
      "year": "经典教学局",
      "moves": 2,
      "total_moves": 4,
      "key_concepts": [
        "最短将杀",
        "王翼弱化",
        "后的威力"
      ],
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "pgn": "1. f3 e5 2. g4 Qh4#",
      "move_sequence": [
        "f3",
        "e5",
        "g4",
        "Qh4#"
      ],
      "curated": true,
      "lesson_order": 1
    },
    "anno": {
      "game_id": "G1_fools_mate",
      "description": "傻瓜将杀 — 4步，完整注释",
      "intro": {
        "flash_squares": [],
        "popup": "傻瓜将杀是国际象棋最快的将杀经典棋局，只需两步！看看白方犯了什么致命错误",
        "voice": true
      },
      "outro": {
        "popup": "f3和g4两步棋严重削弱了白王的防护，黑后从h4直接将死白王。开局走兵要注意线路和子力协调问题！",
        "voice": true
      },
      "board_always": {},
      "moves": [
        {
          "index": 0,
          "move": "f3",
          "popup": "⬆️ <b>1.f3 — 危险的一步！</b><br>f3把王翼的保护兵推走，严重削弱了白王的安全。f3兵原本封锁着黑方进攻的通道……",
          "highlights": [
            {
              "squares": [
                "f3",
                "e4",
                "g4"
              ],
              "color": "#FF572255",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 1,
          "move": "e5",
          "popup": "⬇️ <b>1...e5 — 黑方占据中心</b><br>黑方利用机会占据中心，同时为后的出动做好准备。",
          "highlights": [
            {
              "squares": [
                "d4",
                "f4"
              ],
              "color": "#00BCD444",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e5",
              "to": "d4",
              "color": "#00BCD4AA"
            },
            {
              "from": "e5",
              "to": "f4",
              "color": "#00BCD4AA"
            }
          ]
        },
        {
          "index": 2,
          "move": "g4",
          "popup": "⬆️ <b>2.g4 — 致命错误！</b><br>这步棋彻底打开了h4到e1的对角线！白王完全暴露在黑后的攻击路线上……<br><span style='color:#FF8F00'>⚠️ 黑方下一步将有致命一击！</span>",
          "highlights": [
            {
              "squares": [
                "h4",
                "g3",
                "f2",
                "e1"
              ],
              "color": "#FF8F0066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "h4",
              "to": "e1",
              "color": "#FF8F00CC"
            }
          ]
        },
        {
          "index": 3,
          "move": "Qh4#",
          "popup": "⬇️ <b>2...Qh4# — 将死！🏆</b><br>黑后出击h4，<b>将死白王！</b><br>白王被后控制，向任何方向都无法逃脱，旁边也没有棋子能挡住后的攻击。<br><span style='color:#FFD700'>★ 这就是傻瓜将杀，全程只用了2步！</span>",
          "highlights": [
            {
              "squares": [
                "h4",
                "e1",
                "g3",
                "f2",
                "h1",
                "g5"
              ],
              "color": "#FFD70088",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "h4",
              "to": "e1",
              "color": "#FFD700FF"
            },
            {
              "from": "h4",
              "to": "h1",
              "color": "#FFD700AA"
            }
          ]
        }
      ]
    },
    "explanation": "傻瓜将杀是国际象棋中最快的将杀棋局，又称两步将杀， 仅需2步棋，白方就输了！\r\n\r\n将杀关键点：\r\n1. 白方失误，移动了 f 格兵（通常是f3/f4）和g格兵（g4/g3），直接打开了对国王至关重要的斜线。\r\n2. 黑方充分利用这个失误，利用后（Queen）在h4格的位置，实现对白王最快速的致命一击\r\n\r\n如何避免傻瓜将杀：\r\n1. 不要过早移动f兵：在开局阶段，特别是在未出动马和象之前，避免移动f2/f7的兵，因为这是王安全最薄弱的环节。\r\n2. 注意侧翼防守：在移动g兵时要特别小心，确信没有给对方王后留出通道。 \r\n\r\n这种将杀只可能发生在初学者对局中。要对各种将杀棋形敏感， 在对弈中逐步体验积累。"
  },
  "g2": {
    "meta": {
      "id": "G2_scholars_mate",
      "sequence": 2,
      "type": "classic_game_demo",
      "difficulty": "L0_intro",
      "name_en": "Scholar's Mate",
      "name_cn": "经典棋局 - 学者将杀",
      "players": "（最常见开局陷阱）",
      "year": "经典教学局",
      "moves": 3,
      "total_moves": 7,
      "key_concepts": [
        "f7弱点",
        "象后配合",
        "开局陷阱"
      ],
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "pgn": "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#",
      "move_sequence": [
        "e4",
        "e5",
        "Bc4",
        "Nc6",
        "Qh5",
        "Nf6",
        "Qxf7#"
      ],
      "curated": true,
      "lesson_order": 2
    },
    "anno": {
      "game_id": "G2_scholars_mate",
      "description": "学者将杀 — 7步，完整注释",
      "intro": {
        "flash_squares": [],
        "popup": "【学者将杀】是一种在4步内将死黑王的快速开局陷阱",
        "voice": "这是初学者最常遇到的开局陷阱！白方只用4步棋就能将杀。"
      },
      "outro": {
        "popup": "f7格是黑方开局最大的弱点，只有王一个棋子保护！白方象和后联合攻击f7，一旦黑方不警惕就会被将杀。",
        "voice": true
      },
      "board_always": {},
      "moves": [
        {
          "index": 0,
          "move": "e4",
          "popup": "⬆️ <b>1.e4 — 白方占据中心</b><br>经典的王前兵开局，控制中心、为象和后的出动铺路。",
          "highlights": [
            {
              "squares": [
                "d5",
                "f5"
              ],
              "color": "#8E24AA44",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e4",
              "to": "d5",
              "color": "#8E24AAAA"
            },
            {
              "from": "e4",
              "to": "f5",
              "color": "#8E24AAAA"
            },
            {
              "from": "f1",
              "to": "a6",
              "color": "#8E24AAAA"
            },
            {
              "from": "d1",
              "to": "h5",
              "color": "#8E24AAAA"
            }
          ]
        },
        {
          "index": 1,
          "move": "e5",
          "popup": "⬇️ <b>1...e5 — 对称应对</b><br>黑方同样占中心，是最自然的应法。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 2,
          "move": "Bc4",
          "popup": "⬆️ <b>2.Bc4 — 象瞄准f7！</b><br>白象来到c4，对准了黑王身旁的f7格。f7在开局时只有黑王一个棋子保护，这是黑方最大的弱点！",
          "highlights": [
            {
              "squares": [
                "f7"
              ],
              "color": "#FF572288",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "c4",
              "to": "f7",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 3,
          "move": "Nc6",
          "popup": "⬇️ <b>2...Nc6 — 普通发展</b><br>黑马自然出子，控制d4/e5格。但要注意f7格正在被威胁！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 4,
          "move": "Qh5",
          "popup": "⬆️ <b>3.Qh5 — 双重威胁！⚠️</b><br>白后来到h5，同时威胁两个目标：<br>① 攻击e5兵<br>② 与c4象配合，再次攻击f7！<br>黑方必须小心应对！",
          "highlights": [
            {
              "squares": [
                "e5",
                "f7"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "h5",
              "to": "e5",
              "color": "#FF5722BB"
            },
            {
              "from": "h5",
              "to": "f7",
              "color": "#FF5722BB"
            }
          ]
        },
        {
          "index": 5,
          "move": "Nf6",
          "popup": "⬇️ <b>3...Nf6? — 错误！忽视了威胁</b><br>黑方出马攻击白后，看似合理，但完全忽视了f7格的危险！<br><span style='color:#FF8F00'>⚠️ 正确下法应该是3...g6，把白后赶走！</span>",
          "highlights": [
            {
              "squares": [
                "h5"
              ],
              "color": "#FF8F0044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "f6",
              "to": "h5",
              "color": "#FF8F00AA"
            }
          ]
        },
        {
          "index": 6,
          "move": "Qxf7#",
          "popup": "⬆️ <b>4.Qxf7# — 学者将杀！🏆</b><br>在象的支持下，白后吃掉f7兵，将死黑王！<br>• 无棋子能吃后<br>• 也无棋子能挡住将军<br><span style='color:#FFD700'>★ 这就是学者将杀！用象+后联合攻击f7！</span>",
          "highlights": [
            {
              "squares": [
                "f7",
                "e8",
                "e7",
                "d8"
              ],
              "color": "#FFD70088",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "h5",
              "to": "f7",
              "color": "#FF5722FF"
            },
            {
              "from": "c4",
              "to": "f7",
              "color": "#FF5722FF"
            }
          ]
        }
      ]
    },
    "explanation": "\r\n这是最常见的开局陷阱，是经典教学局。\r\n\r\n【对弱格的利用】\r\n• 开局初期f7只有黑王一个棋子保护\r\n• 白象在c4时正好对准f7的对角线\r\n• 白后在h5时又可以攻击f7格\r\n\r\n【如何防守？】\r\n★ 看到Bc4后要小心f7！\r\n★ 白后到h5后，不能走Nf6（没有保护f7）\r\n★ 正确应法：...g6把后赶走，再出子发展\r\n\r\n【学习要点】\r\n★ f7是黑方的弱穴，只有王保护！\r\n★ 象和后是将杀的黄金搭档\r\n★ 出子前先检查对方的威胁！\r\n# END\r\n\r\n"
  },
  "g3": {
    "meta": {
      "id": "G3_immortal_game",
      "sequence": 3,
      "type": "classic_game_demo",
      "difficulty": "L0_intro",
      "name_en": "The Immortal Game",
      "name_cn": "经典棋局 - 不朽之局",
      "players": "Anderssen vs Kieseritzky, 1851",
      "year": "1851",
      "moves": 22,
      "total_moves": 45,
      "key_concepts": [
        "浪漫派牺牲",
        "连续进攻",
        "王的被迫移动"
      ],
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "pgn": "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#",
      "move_sequence": [
        "e4",
        "e5",
        "f4",
        "exf4",
        "Bc4",
        "Qh4+",
        "Kf1",
        "b5",
        "Bxb5",
        "Nf6",
        "Nf3",
        "Qh6",
        "d3",
        "Nh5",
        "Nh4",
        "Qg5",
        "Nf5",
        "c6",
        "g4",
        "Nf6",
        "Rg1",
        "cxb5",
        "h4",
        "Qg6",
        "h5",
        "Qg5",
        "Qf3",
        "Ng8",
        "Bxf4",
        "Qf6",
        "Nc3",
        "Bc5",
        "Nd5",
        "Qxb2",
        "Bd6",
        "Bxg1",
        "e5",
        "Qxa1+",
        "Ke2",
        "Na6",
        "Nxg7+",
        "Kd8",
        "Qf6+",
        "Nxf6",
        "Be7#"
      ],
      "curated": true,
      "lesson_order": 3
    },
    "anno": {
      "game_id": "G3_immortal_game",
      "description": "不朽之局 — 45步，完整注释",
      "intro": {
        "flash_squares": [],
        "popup": "不朽之局， 这局棋被誉为有史以来最精彩的对局之一！白方通过弃掉两个车、一个象和后，入局取胜！",
        "voice": true
      },
      "outro": {
        "popup": "白方用惊人的子力牺牲，最终用两个马和一个象将死了黑王。这局棋展示了国际象棋的无穷魅力！",
        "voice": true
      },
      "board_always": {},
      "moves": [
        {
          "index": 0,
          "move": "e4",
          "popup": "⬆️ <b>1.e4</b> — 王前兵开局",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 1,
          "move": "e5",
          "popup": "⬇️ <b>1...e5</b> — 对称回应",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 2,
          "move": "f4",
          "popup": "⬆️ <b>2.f4 — 王翼弃兵！</b><br>这是著名的【王翼弃兵开局】，白方主动献出f4兵来换取更快的发展速度。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 3,
          "move": "exf4",
          "popup": "⬇️ <b>2...exf4 — 接受弃兵</b><br>黑方笑纳这个兵，但将为此付出代价。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 4,
          "move": "Bc4",
          "popup": "⬆️ <b>3.Bc4</b> — 象快速出动，瞄准f7",
          "highlights": [
            {
              "squares": [
                "f7"
              ],
              "color": "#FF572244",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "c4",
              "to": "f7",
              "color": "#FF5722AA"
            }
          ]
        },
        {
          "index": 5,
          "move": "Qh4+",
          "popup": "⬇️ <b>3...Qh4+ — 将军！</b><br>黑后出动将军，迫使白王移动，白方失去了王车易位的权利！",
          "highlights": [
            {
              "squares": [
                "e1",
                "h4"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "h4",
              "to": "e1",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 6,
          "move": "Kf1",
          "popup": "⬆️ <b>4.Kf1 — 王被迫移动！</b><br>白王逃到f1，失去了王车易位权利。局面对白方不利……但安德森有惊人的反击！",
          "highlights": [
            {
              "squares": [
                "f1"
              ],
              "color": "#FF8F0044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 7,
          "move": "b5",
          "popup": "⬇️ <b>4...b5 — 攻击白象！</b><br>黑方用b5兵攻击c4的白象，试图赢得材料。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 8,
          "move": "Bxb5",
          "popup": "⬆️ <b>5.Bxb5 — 弃象！</b><br>白方毫不犹豫地用象吃掉b5兵！",
          "highlights": [
            {
              "squares": [
                "b5"
              ],
              "color": "#D81B6044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 9,
          "move": "Nf6",
          "popup": "⬇️ <b>5...Nf6</b> — 黑马攻击白兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 10,
          "move": "Nf3",
          "popup": "⬆️ <b>6.Nf3</b> — 白马出动，同时攻击h4黑后",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 11,
          "move": "Qh6",
          "popup": "⬇️ <b>6...Qh6</b> — 黑后退回",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 12,
          "move": "d3",
          "popup": "⬆️ <b>7.d3</b> — 巩固中心",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 13,
          "move": "Nh5",
          "popup": "⬇️ <b>7...Nh5</b> — 黑方试图攻击g3",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 14,
          "move": "Nh4",
          "popup": "⬆️ <b>8.Nh4</b> — 马跳向进攻位置",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 15,
          "move": "Qg5",
          "popup": "⬇️ <b>8...Qg5</b> — 黑后继续骚扰",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 16,
          "move": "Nf5",
          "popup": "⬆️ <b>9.Nf5 — 马跳f5！</b><br>白马来到极佳的攻击位置，威胁黑后！",
          "highlights": [
            {
              "squares": [
                "f5",
                "g7",
                "h6"
              ],
              "color": "#FF572244",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 17,
          "move": "c6",
          "popup": "⬇️ <b>9...c6</b> — 攻击白象",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 18,
          "move": "g4",
          "popup": "⬆️ <b>10.g4 — 进攻推进！</b><br>白方g4兵攻击黑马，同时为进一步推进做准备。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 19,
          "move": "Nf6",
          "popup": "⬇️ <b>10...Nf6</b> — 黑马撤回",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 20,
          "move": "Rg1",
          "popup": "⬆️ <b>11.Rg1 — 车支援进攻！</b><br>白方没有躲象， 而是车占领g线，加快进攻节奏！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 21,
          "move": "cxb5",
          "popup": "⬇️ <b>11...cxb5</b> — 黑方终于吃掉象",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 22,
          "move": "h4",
          "popup": "⬆️ <b>12.h4 — h兵推进</b><br>攻击黑后，进一步压迫黑方。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 23,
          "move": "Qg6",
          "popup": "⬇️ <b>12...Qg6</b> — 黑后再次移动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 24,
          "move": "h5",
          "popup": "⬆️ <b>13.h5 — h兵再推！</b><br>白方h兵推进赶黑后，令黑方疲于应付。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 25,
          "move": "Qg5",
          "popup": "⬇️ <b>13...Qg5</b> — 黑后躲开攻击",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 26,
          "move": "Qf3",
          "popup": "⬆️ <b>14.Qf3 — 后加入进攻！</b><br>白后出动，威胁a8的车，白方进一步加强攻势！",
          "highlights": [
            {
              "squares": [
                "f7",
                "a8"
              ],
              "color": "#FF572244",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "f3",
              "to": "a8",
              "color": "#FF5722AA"
            }
          ]
        },
        {
          "index": 27,
          "move": "Ng8",
          "popup": "⬇️ <b>14...Ng8</b> — 黑马撤回原位！<br>黑马退回原位，防止白兵e5, 同时要吃马和a8的车",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 28,
          "move": "Bxf4",
          "popup": "⬆️ <b>15.Bxf4 — 象吃掉f4兵</b><br>白方将弃出的f4兵重新夺回，现在局面大好。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 29,
          "move": "Qf6",
          "popup": "⬇️ <b>15...Qf6</b> — 黑后试躲避白象， 同时威胁a1的车",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 30,
          "move": "Nc3",
          "popup": "⬆️ <b>16.Nc3 — 马加入进攻阵营</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 31,
          "move": "Bc5",
          "popup": "⬇️ <b>16...Bc5</b> — 黑方终于出子发展，要吃白方g1的车！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 32,
          "move": "Nd5",
          "popup": "⬆️ <b>17.Nd5 — 马跳中心要点！</b><br>白马踏上d5绝佳位置，威胁更有价值的后！",
          "highlights": [
            {
              "squares": [
                "d5"
              ],
              "color": "#C6D50066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "d5",
              "to": "f6",
              "color": "#FF5722AA"
            }
          ]
        },
        {
          "index": 33,
          "move": "Qxb2",
          "popup": "⬇️ <b>17...Qxb2</b> — 黑后贪吃白兵<br>黑后吃兵，威胁车并连带将军",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 34,
          "move": "Bd6",
          "popup": "⬆️ <b>18.Bd6 — 弃象！🔥</b><br>白方不仅没有躲车，还送出白象！这是不朽之局最精彩的一步！",
          "highlights": [
            {
              "squares": [
                "d6",
                "e7",
                "c7"
              ],
              "color": "#FF8F0066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 35,
          "move": "Bxg1",
          "popup": "⬇️ <b>18...Bxg1</b> — 黑方吃掉g1的车！<br>黑方不接受换象，直接吃白车。但白方已经做好了下一步的计划！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 36,
          "move": "e5",
          "popup": "⬆️ <b>19.e5 — 弃第二个车！🔥🔥</b><br>白兵继续推！白方甘愿损失两个车来追求将杀！这就是浪漫派的精神！",
          "highlights": [
            {
              "squares": [
                "e5",
                "f6",
                "d6"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e5",
              "to": "f6",
              "color": "#FF5722BB"
            }
          ]
        },
        {
          "index": 37,
          "move": "Qxa1+",
          "popup": "⬇️ <b>19...Qxa1+ — 黑后吃白车并将军</b><br>黑方把白方第二个车也吃掉了，还将军！白方大量损失子力……真的输了吗？",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 38,
          "move": "Ke2",
          "popup": "⬆️ <b>20.Ke2 — 王躲过将军！</b><br>这是提前预判过的！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 39,
          "move": "Na6",
          "popup": "⬇️ <b>20...Na6</b> — 黑方暂时没有进一步的进攻手段， 只能发展马",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 40,
          "move": "Nxg7+",
          "popup": "⬆️ <b>21.Nxg7+ — 将军！最终序列开始！</b><br>马吃g7将军，将杀序列启动！",
          "highlights": [
            {
              "squares": [
                "g7",
                "e8"
              ],
              "color": "#FF8F0066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "g7",
              "to": "e8",
              "color": "#FF8F00CC"
            }
          ]
        },
        {
          "index": 41,
          "move": "Kd8",
          "popup": "⬇️ <b>21...Kd8</b> — 王被迫移动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 42,
          "move": "Qf6+",
          "popup": "⬆️ <b>22.Qf6+ — 后将军！</b><br>白后将军， 通过送后引出黑马。",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "f6",
              "to": "d8",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 43,
          "move": "Nxf6",
          "popup": "⬇️ <b>22...Nxf6 — 黑马被迫吃后！</b><br>黑方只能用马吃掉白后！但这正是白方的计划……",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 44,
          "move": "Be7#",
          "popup": "⬆️ <b>23.Be7# — 将死！🏆✨</b><br><b>象将死！</b>白方用最后剩下的象完成绝杀！<br>黑王无处可逃，白方赢得了这场惊天大战！<br><span style='color:#FFD700'>★ 这就是「不朽之局」，象棋历史上最伟大的进攻之一！</span>",
          "highlights": [
            {
              "squares": [
                "e7",
                "d8"
              ],
              "color": "#FFD700AA",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e7",
              "to": "d8",
              "color": "#FFD700FF"
            }
          ]
        }
      ]
    },
    "explanation": "【不朽之局】\r\n安德森 vs 基泽里茨基，1851年伦敦\r\n\r\n这局棋在1855年由国际象棋历史学家冯·比洛命名为\"不朽之局\"，\r\n被誉为有史以来攻击性象棋的最高峰之一。\r\n\r\n【棋局亮点】\r\n• 白方在被将军、王被迫移走后仍发动猛烈攻势\r\n• 连续牺牲了两个车（白方牺牲了h1车和a1车）\r\n• 最终放弃了后，仅用马和象将死对方\r\n\r\n【学习要点】\r\n★ 加快出子速度，控制局势非常重要\r\n★ 本局展示的宁可牺牲象，也要加快抢占进攻速度的精彩思路\r\n★ 这样大的棋子牺牲， 是有强大计算做基础的， 具有强大的计算能力和开阔的思路\r\n# END\r\n"
  },
  "g4": {
    "meta": {
      "id": "G4_game_of_century",
      "sequence": 4,
      "type": "classic_game_demo",
      "difficulty": "L0_intro",
      "name_en": "The Game of the Century",
      "name_cn": "经典棋局 - 世纪之局",
      "players": "Donald Byrne vs Robert James Fischer, 1956",
      "year": "1956",
      "moves": 41,
      "total_moves": 82,
      "key_concepts": [
        "马的牺牲",
        "13岁天才",
        "将杀序列"
      ],
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "pgn": "1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 17. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#",
      "move_sequence": [
        "Nf3",
        "Nf6",
        "c4",
        "g6",
        "Nc3",
        "Bg7",
        "d4",
        "O-O",
        "Bf4",
        "d5",
        "Qb3",
        "dxc4",
        "Qxc4",
        "c6",
        "e4",
        "Nbd7",
        "Rd1",
        "Nb6",
        "Qc5",
        "Bg4",
        "Bg5",
        "Na4",
        "Qa3",
        "Nxc3",
        "bxc3",
        "Nxe4",
        "Bxe7",
        "Qb6",
        "Bc4",
        "Nxc3",
        "Bc5",
        "Rfe8+",
        "Kf1",
        "Be6",
        "Bxb6",
        "Bxc4+",
        "Kg1",
        "Ne2+",
        "Kf1",
        "Nxd4+",
        "Kg1",
        "Ne2+",
        "Kf1",
        "Nc3+",
        "Kg1",
        "axb6",
        "Qb4",
        "Ra4",
        "Qxb6",
        "Nxd1",
        "h3",
        "Rxa2",
        "Kh2",
        "Nxf2",
        "Re1",
        "Rxe1",
        "Qd8+",
        "Bf8",
        "Nxe1",
        "Bd5",
        "Nf3",
        "Ne4",
        "Qb8",
        "b5",
        "h4",
        "h5",
        "Ne5",
        "Kg7",
        "Kg1",
        "Bc5+",
        "Kf1",
        "Ng3+",
        "Ke1",
        "Bb4+",
        "Kd1",
        "Bb3+",
        "Kc1",
        "Ne2+",
        "Kb1",
        "Nc3+",
        "Kc1",
        "Rc2#"
      ],
      "curated": true,
      "lesson_order": 4
    },
    "anno": {
      "game_id": "G4_game_of_century",
      "description": "世纪之局 — 82步，完整注释",
      "intro": {
        "flash_squares": [],
        "popup": "【世纪之局】1956年，13岁的费舍尔在对阵成年高手拜恩时，走出华丽的后弃子组合、极其成熟的战略布局！这局棋被誉为世纪之局。",
        "voice": true
      },
      "outro": {
        "popup": "费舍尔以精准的计算，用马的牺牲换取了决定性的优势，最终以令人叹为观止的方式将死对方！",
        "voice": true
      },
      "board_always": {},
      "moves": [
        {
          "index": 0,
          "move": "Nf3",
          "popup": "⬆️ <b>1.Nf3</b> — 王马发展",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 1,
          "move": "Nf6",
          "popup": "⬇️ <b>1...Nf6</b> — 黑马对称出动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 2,
          "move": "c4",
          "popup": "⬆️ <b>2.c4</b> — 英式开局，争夺d5",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 3,
          "move": "g6",
          "popup": "⬇️ <b>2...g6</b> — 黑方准备象纤维化，国王印度风格",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 4,
          "move": "Nc3",
          "popup": "⬆️ <b>3.Nc3</b> — 马发展控制中心",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 5,
          "move": "Bg7",
          "popup": "⬇️ <b>3...Bg7</b> — 象纤维化完成！控制h8-a1对角线",
          "highlights": [
            {
              "squares": [
                "a1",
                "h8"
              ],
              "color": "#00BCD433",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "g7",
              "to": "a1",
              "color": "#00BCD488"
            }
          ]
        },
        {
          "index": 6,
          "move": "d4",
          "popup": "⬆️ <b>4.d4</b> — 白方建立双兵中心",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 7,
          "move": "O-O",
          "popup": "⬇️ <b>4...O-O</b> — 黑王易位，王安全",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 8,
          "move": "Bf4",
          "popup": "⬆️ <b>5.Bf4</b> — 象出动控制c7",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 9,
          "move": "d5",
          "popup": "⬇️ <b>5...d5</b> — 反击中心！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 10,
          "move": "Qb3",
          "popup": "⬆️ <b>6.Qb3</b> — 后出动攻击d5和b7",
          "highlights": [
            {
              "squares": [
                "d5",
                "b7"
              ],
              "color": "#FFD70044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 11,
          "move": "dxc4",
          "popup": "⬇️ <b>6...dxc4!</b> — 弃兵换取主动权， 将白后引入到不太安全的位置！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 12,
          "move": "Qxc4",
          "popup": "⬆️ <b>7.Qxc4</b> — 后夺回兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 13,
          "move": "c6",
          "popup": "⬇️ <b>7...c6</b> — 加强中心控制，为马开路",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 14,
          "move": "e4",
          "popup": "⬆️ <b>8.e4</b> — 扩大中心优势",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 15,
          "move": "Nbd7",
          "popup": "⬇️ <b>8...Nbd7</b> — 马发展，准备Nb6",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 16,
          "move": "Rd1",
          "popup": "⬆️ <b>9.Rd1</b> — 车移到d列支援",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 17,
          "move": "Nb6",
          "popup": "⬇️ <b>9...Nb6</b> — 攻击白后",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 18,
          "move": "Qc5",
          "popup": "⬆️ <b>10.Qc5</b> — 后进攻位置",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 19,
          "move": "Bg4",
          "popup": "⬇️ <b>10...Bg4</b> — 象钉住马",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 20,
          "move": "Bg5",
          "popup": "⬆️ <b>11.Bg5</b> — 反钉黑马",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 21,
          "move": "Na4",
          "popup": "⬇️ <b>11...Na4! — 马跳！</b><br>黑方的第一个关键步！马跳向进攻位置，攻击白后！也做好牺牲马的准备！",
          "highlights": [
            {
              "squares": [
                "a4",
                "c5",
                "c3",
                "b2"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "a4",
              "to": "c5",
              "color": "#FF5722CC"
            },
            {
              "from": "a4",
              "to": "c3",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 22,
          "move": "Qa3",
          "popup": "⬆️ <b>12.Qa3</b> — 白方认为直接吃马会失去对e4的控制，后被迫撤退",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 23,
          "move": "Nxc3",
          "popup": "⬇️ <b>12...Nxc3!</b> — 马开始吃子！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 24,
          "move": "bxc3",
          "popup": "⬆️ <b>13.bxc3</b> — 兵吃马",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 25,
          "move": "Nxe4",
          "popup": "⬇️ <b>13...Nxe4! ⚡ 马出击！</b><br>这是世纪之局最震撼的一步！做好了被白象攻击的准备。",
          "highlights": [
            {
              "squares": [
                "e4",
                "c5",
                "b4"
              ],
              "color": "#FF8F0088",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e4",
              "to": "c5",
              "color": "#FF8F00CC"
            }
          ]
        },
        {
          "index": 26,
          "move": "Bxe7",
          "popup": "⬆️ <b>14.Bxe7</b> — 象吃e7，攻击黑后和车",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 27,
          "move": "Qb6",
          "popup": "⬇️ <b>14...Qb6!</b> — 后出击！",
          "highlights": [
            {
              "squares": [
                "b6",
                "b2",
                "f2"
              ],
              "color": "#FFD70066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 28,
          "move": "Bc4",
          "popup": "⬆️ <b>15.Bc4</b> — 象威胁f7",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 29,
          "move": "Nxc3",
          "popup": "⬇️ <b>15...Nxc3!</b> — 马继续吃子！做好弃子的准备！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 30,
          "move": "Bc5",
          "popup": "⬆️ <b>16.Bc5</b> — 白方象直接威胁黑后！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 31,
          "move": "Rfe8+",
          "popup": "⬇️ <b>16...Rfe8+ — 车将军！</b><br>黑车加入进攻，将军！",
          "highlights": [
            {
              "squares": [
                "e1"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e8",
              "to": "e1",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 32,
          "move": "Kf1",
          "popup": "⬆️ <b>17.Kf1</b> — 王被迫移动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 33,
          "move": "Be6",
          "popup": "⬇️ <b>17...Be6!</b> — 象攻击c4！<br>黑象攻击白象，同时威胁白后！做好了弃掉后的准备！",
          "highlights": [
            {
              "squares": [
                "c4"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e6",
              "to": "c4",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 34,
          "move": "Bxb6",
          "popup": "⬆️ <b>18.Bxb6</b> — 吃掉黑后？！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 35,
          "move": "Bxc4+",
          "popup": "⬇️ <b>18...Bxc4+ — 将军！</b><br>吃象将军！",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "c4",
              "to": "f1",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 36,
          "move": "Kg1",
          "popup": "⬆️ <b>19.Kg1</b> — 王撤退",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 37,
          "move": "Ne2+",
          "popup": "⬇️ <b>19...Ne2+ — 马将军！</b>",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "e2",
              "to": "g1",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 38,
          "move": "Kf1",
          "popup": "⬆️ <b>20.Kf1</b> — 王被迫移动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 39,
          "move": "Nxd4+",
          "popup": "⬇️ <b>20...Nxd4+ — 马吃兵将军！</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 40,
          "move": "Kg1",
          "popup": "⬆️ <b>21.Kg1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 41,
          "move": "Ne2+",
          "popup": "⬇️ <b>21...Ne2+</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 42,
          "move": "Kf1",
          "popup": "⬆️ <b>22.Kf1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 43,
          "move": "Nc3+",
          "popup": "⬇️ <b>22...Nc3+</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 44,
          "move": "Kg1",
          "popup": "⬆️ <b>23.Kg1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 45,
          "move": "axb6",
          "popup": "⬇️ <b>23...axb6</b> — 黑方吃掉象！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 46,
          "move": "Qb4",
          "popup": "⬆️ <b>24.Qb4</b> — 白后试图反击",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 47,
          "move": "Ra4",
          "popup": "⬇️ <b>24...Ra4!</b> — 车攻击白后！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 48,
          "move": "Qxb6",
          "popup": "⬆️ <b>25.Qxb6</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 49,
          "move": "Nxd1",
          "popup": "⬇️ <b>25...Nxd1!</b> — 马吃白车！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 50,
          "move": "h3",
          "popup": "⬆️ <b>26.h3</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 51,
          "move": "Rxa2",
          "popup": "⬇️ <b>26...Rxa2</b> — 车吃a2兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 52,
          "move": "Kh2",
          "popup": "⬆️ <b>27.Kh2</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 53,
          "move": "Nxf2",
          "popup": "⬇️ <b>27...Nxf2!</b> — 马吃f2兵！进一步得子！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 54,
          "move": "Re1",
          "popup": "⬆️ <b>28.Re1</b> — 白方孤注一掷",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 55,
          "move": "Rxe1",
          "popup": "⬇️ <b>28...Rxe1!</b> — 车吃车！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 56,
          "move": "Qd8+",
          "popup": "⬆️ <b>29.Qd8+ — 白后将军，困兽犹斗！</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 57,
          "move": "Bf8",
          "popup": "⬇️ <b>29...Bf8</b> — 黑象挡将，守住阵线",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 58,
          "move": "Nxe1",
          "popup": "⬆️ <b>30.Nxe1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 59,
          "move": "Bd5",
          "popup": "⬇️ <b>30...Bd5!</b> — 象占中心要道，控制局面！",
          "highlights": [
            {
              "squares": [
                "d5"
              ],
              "color": "#00BCD455",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 60,
          "move": "Nf3",
          "popup": "⬆️ <b>31.Nf3</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 61,
          "move": "Ne4",
          "popup": "⬇️ <b>31...Ne4!</b> — 马跳入绝佳位置",
          "highlights": [
            {
              "squares": [
                "e4",
                "c3",
                "f2",
                "d2"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": []
        },
        {
          "index": 62,
          "move": "Qb8",
          "popup": "⬆️ <b>32.Qb8</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 63,
          "move": "b5",
          "popup": "⬇️ <b>32...b5</b> — 兵前进到安全位置",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 64,
          "move": "h4",
          "popup": "⬆️ <b>33.h4</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 65,
          "move": "h5",
          "popup": "⬇️ <b>33...h5</b> — 封锁白方h兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 66,
          "move": "Ne5",
          "popup": "⬆️ <b>34.Ne5</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 67,
          "move": "Kg7",
          "popup": "⬇️ <b>34...Kg7</b> — 王移到更安全位置",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 68,
          "move": "Kg1",
          "popup": "⬆️ <b>35.Kg1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 69,
          "move": "Bc5+",
          "popup": "⬇️ <b>35...Bc5+ — 象将军！</b><br>黑象将军，追逐白王！",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "c5",
              "to": "f2",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 70,
          "move": "Kf1",
          "popup": "⬆️ <b>36.Kf1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 71,
          "move": "Ng3+",
          "popup": "⬇️ <b>36...Ng3+ — 马将军！</b>",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "g3",
              "to": "f1",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 72,
          "move": "Ke1",
          "popup": "⬆️ <b>37.Ke1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 73,
          "move": "Bb4+",
          "popup": "⬇️ <b>37...Bb4+ — 象将军！</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 74,
          "move": "Kd1",
          "popup": "⬆️ <b>38.Kd1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 75,
          "move": "Bb3+",
          "popup": "⬇️ <b>38...Bb3+ — 又是象将军！</b><br>黑方不断将军，白王四处奔逃！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 76,
          "move": "Kc1",
          "popup": "⬆️ <b>39.Kc1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 77,
          "move": "Ne2+",
          "popup": "⬇️ <b>39...Ne2+ — 马将军！</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 78,
          "move": "Kb1",
          "popup": "⬆️ <b>40.Kb1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 79,
          "move": "Nc3+",
          "popup": "⬇️ <b>40...Nc3+ — 马再将军！</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 80,
          "move": "Kc1",
          "popup": "⬆️ <b>41.Kc1</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 81,
          "move": "Rc2#",
          "popup": "⬇️ <b>41...Rc2# — 将死！🏆🌟</b><br>黑车来到c2，将死白王！白王被马、象和车团团包围，无处可逃！<br><span style='color:#FFD700'>★ 这就是世纪之局！13岁的费舍尔用天才之作震惊了整个国际象棋世界！</span>",
          "highlights": [
            {
              "squares": [
                "c2",
                "c1",
                "b1",
                "d1"
              ],
              "color": "#FFD700AA",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "c2",
              "to": "c1",
              "color": "#FFD700FF"
            }
          ]
        }
      ]
    },
    "explanation": "【世纪之局 】\r\n多纳德·拜恩 vs 罗伯特·费舍尔，1956年\r\n\r\n这局棋由国际象棋作家汉斯·科莫兹尼命名为\"世纪之局\"。\r\n费舍尔当时只有13岁，却下出了极其精深的牺牲战术！\r\n\r\n【关键时刻：第17步 Ne4!】\r\n费舍尔弃掉了后！在Ne4之后，拜恩如果吃后，黑方有Bxc4+\r\n赢得更多子力。费舍尔通过精密计算看穿了整个将杀序列。\r\n\r\n【棋局特点】\r\n• 黑方（费舍尔）以后的牺牲换取战略优势\r\n• 将杀序列长达24步，计算精准\r\n• 展示了天才少年惊人的计算能力和棋局感觉\r\n\r\n【学习要点】\r\n★ 敢于牺牲子力，追求战略优势\r\n★ 精确计算比单纯数子力价值更重要\r\n★ 即使面对成年高手，信心和精确计算能赢得胜利\r\n"
  },
  "g5": {
    "meta": {
      "id": "G5_evergreen_game",
      "sequence": 5,
      "type": "classic_game_demo",
      "difficulty": "L0_intro",
      "name_en": "The Evergreen Game",
      "name_cn": "经典棋局 - 常青树之局",
      "players": "Adolf Anderssen vs Jean Dufresne, 1852",
      "year": "1852",
      "moves": 23,
      "total_moves": 47,
      "key_concepts": [
        "车的牺牲",
        "后的牺牲",
        "双象将杀"
      ],
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#",
      "move_sequence": [
        "e4",
        "e5",
        "Nf3",
        "Nc6",
        "Bc4",
        "Bc5",
        "b4",
        "Bxb4",
        "c3",
        "Ba5",
        "d4",
        "exd4",
        "O-O",
        "d3",
        "Qb3",
        "Qf6",
        "e5",
        "Qg6",
        "Re1",
        "Nge7",
        "Ba3",
        "b5",
        "Qxb5",
        "Rb8",
        "Qa4",
        "Bb6",
        "Nbd2",
        "Bb7",
        "Ne4",
        "Qf5",
        "Bxd3",
        "Qh5",
        "Nf6+",
        "gxf6",
        "exf6",
        "Rg8",
        "Rad1",
        "Qxf3",
        "Rxe7+",
        "Nxe7",
        "Qxd7+",
        "Kxd7",
        "Bf5+",
        "Ke8",
        "Bd7+",
        "Kf8",
        "Bxe7#"
      ],
      "curated": true,
      "lesson_order": 5
    },
    "anno": {
      "game_id": "G5_evergreen_game",
      "description": "常青树之局 — 47步，完整注释",
      "intro": {
        "flash_squares": [],
        "popup": "【常青树之局】1852年，安德森再次创造奇迹！这局棋展示了后和车的双重牺牲，最终用双象完成绝杀，被誉为常青树之局",
        "voice": true
      },
      "outro": {
        "popup": "安德森先后献出了车e7和后d7，最终用象将死黑王！这局棋以其绝妙的收官被后世反复研究。",
        "voice": true
      },
      "board_always": {},
      "moves": [
        {
          "index": 0,
          "move": "e4",
          "popup": "⬆️ <b>1.e4</b> — 经典开局",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 1,
          "move": "e5",
          "popup": "⬇️ <b>1...e5</b>",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 2,
          "move": "Nf3",
          "popup": "⬆️ <b>2.Nf3</b> — 马出动攻击e5",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 3,
          "move": "Nc6",
          "popup": "⬇️ <b>2...Nc6</b> — 马保护e5",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 4,
          "move": "Bc4",
          "popup": "⬆️ <b>3.Bc4</b> — 意大利开局，象瞄准f7",
          "highlights": [
            {
              "squares": [
                "f7"
              ],
              "color": "#FFD70044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "c4",
              "to": "f7",
              "color": "#FFD700AA"
            }
          ]
        },
        {
          "index": 5,
          "move": "Bc5",
          "popup": "⬇️ <b>3...Bc5</b> — 黑方同样出象，慢象开局",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 6,
          "move": "b4",
          "popup": "⬆️ <b>4.b4! — 依文斯弃兵！</b><br>著名的依文斯弃兵！白方献出b4兵换取更快的发展。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 7,
          "move": "Bxb4",
          "popup": "⬇️ <b>4...Bxb4</b> — 黑象接受弃兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 8,
          "move": "c3",
          "popup": "⬆️ <b>5.c3</b> — 准备d4推进，为中心让路",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 9,
          "move": "Ba5",
          "popup": "⬇️ <b>5...Ba5</b> — 黑象撤退",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 10,
          "move": "d4",
          "popup": "⬆️ <b>6.d4!</b> — 占据中心，反击！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 11,
          "move": "exd4",
          "popup": "⬇️ <b>6...exd4</b> — 黑方被迫吃兵",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 12,
          "move": "O-O",
          "popup": "⬆️ <b>7.O-O!</b> — 王车易位，暂不吃回d4兵！<br>白方王车易位，把安全放在首位，展现宏大构想。",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 13,
          "move": "d3",
          "popup": "⬇️ <b>7...d3</b> — 黑方兵继续推进",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 14,
          "move": "Qb3",
          "popup": "⬆️ <b>8.Qb3</b> — 后出动，双重攻击f7和b7",
          "highlights": [
            {
              "squares": [
                "f7",
                "b7"
              ],
              "color": "#FFD70044",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "b3",
              "to": "f7",
              "color": "#FFD700AA"
            }
          ]
        },
        {
          "index": 15,
          "move": "Qf6",
          "popup": "⬇️ <b>8...Qf6</b> — 黑后出动防守f7",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 16,
          "move": "e5",
          "popup": "⬆️ <b>9.e5!</b> — 兵推进攻击黑后",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 17,
          "move": "Qg6",
          "popup": "⬇️ <b>9...Qg6</b> — 黑后被迫撤退",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 18,
          "move": "Re1",
          "popup": "⬆️ <b>10.Re1</b> — 车加入攻势！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 19,
          "move": "Nge7",
          "popup": "⬇️ <b>10...Nge7</b> — 黑方出马发展",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 20,
          "move": "Ba3",
          "popup": "⬆️ <b>11.Ba3!</b> — 象阻止黑方王车易位！<br>这步棋使黑王无法易位，黑王将永远处于危险中。",
          "highlights": [
            {
              "squares": [
                "e7"
              ],
              "color": "#FF572266",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "a3",
              "to": "e7",
              "color": "#FF5722AA"
            }
          ]
        },
        {
          "index": 21,
          "move": "b5",
          "popup": "⬇️ <b>11...b5</b> — 黑方试图驱逐白象",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 22,
          "move": "Qxb5",
          "popup": "⬆️ <b>12.Qxb5!</b> — 后弃兵取得优势，仍然进攻！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 23,
          "move": "Rb8",
          "popup": "⬇️ <b>12...Rb8</b> — 黑车攻击白后",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 24,
          "move": "Qa4",
          "popup": "⬆️ <b>13.Qa4</b> — 后撤退保持压力",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 25,
          "move": "Bb6",
          "popup": "⬇️ <b>13...Bb6</b> — 黑象撤退",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 26,
          "move": "Nbd2",
          "popup": "⬆️ <b>14.Nbd2</b> — 马加入进攻",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 27,
          "move": "Bb7",
          "popup": "⬇️ <b>14...Bb7</b> — 黑象发展",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 28,
          "move": "Ne4",
          "popup": "⬆️ <b>15.Ne4</b> — 马跳控制中心！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 29,
          "move": "Qf5",
          "popup": "⬇️ <b>15...Qf5</b> — 黑后被迫移动",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 30,
          "move": "Bxd3",
          "popup": "⬆️ <b>16.Bxd3</b> — 象吃d3兵，得回子力",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 31,
          "move": "Qh5",
          "popup": "⬇️ <b>16...Qh5</b> — 黑后攻白马",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 32,
          "move": "Nf6+",
          "popup": "⬆️ <b>17.Nf6+! — 马将军！</b><br>安德森弃马！这是将杀序列的开始！",
          "highlights": [
            {
              "squares": [
                "f6",
                "e8"
              ],
              "color": "#FF8F0066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "f6",
              "to": "g8",
              "color": "#FF8F00CC"
            }
          ]
        },
        {
          "index": 33,
          "move": "gxf6",
          "popup": "⬇️ <b>17...gxf6</b> — 黑方吃掉马，打开g线",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 34,
          "move": "exf6",
          "popup": "⬆️ <b>18.exf6!</b> — 兵继续推进，封锁局面！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 35,
          "move": "Rg8",
          "popup": "⬇️ <b>18...Rg8</b> — 黑车进g线",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 36,
          "move": "Rad1",
          "popup": "⬆️ <b>19.Rad1</b> — 车加入攻势！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 37,
          "move": "Qxf3",
          "popup": "⬇️ <b>19...Qxf3</b> — 黑后吃白马！",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 38,
          "move": "Rxe7+",
          "popup": "⬆️ <b>20.Rxe7+!! — 献车！🔥🔥🔥</b><br>安德森献出白车！这是局中最精妙的一步！",
          "highlights": [
            {
              "squares": [
                "e7",
                "e8"
              ],
              "color": "#FF8F0088",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e7",
              "to": "e8",
              "color": "#FF8F00FF"
            }
          ]
        },
        {
          "index": 39,
          "move": "Nxe7",
          "popup": "⬇️ <b>20...Nxe7</b> — 黑马无奈吃车",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 40,
          "move": "Qxd7+",
          "popup": "⬆️ <b>21.Qxd7+!! — 献后！🔥🔥🔥🔥</b><br>安德森再献出后！黑王必须吃后，然后双象将杀！<br><span style='color:#FFD700'>这是经典的献后将杀！</span>",
          "highlights": [
            {
              "squares": [
                "d7",
                "d8"
              ],
              "color": "#FF8F0099",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "d7",
              "to": "d8",
              "color": "#FF8F00FF"
            }
          ]
        },
        {
          "index": 41,
          "move": "Kxd7",
          "popup": "⬇️ <b>21...Kxd7</b> — 黑王被迫吃后",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 42,
          "move": "Bf5+",
          "popup": "⬆️ <b>22.Bf5+</b> — 象将军，追逐黑王！",
          "highlights": [],
          "concept_arrows": [
            {
              "from": "f5",
              "to": "d7",
              "color": "#FF5722CC"
            }
          ]
        },
        {
          "index": 43,
          "move": "Ke8",
          "popup": "⬇️ <b>22...Ke8</b> — 王继续逃跑",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 44,
          "move": "Bd7+",
          "popup": "⬆️ <b>23.Bd7+</b> — 另一个象将军！<br>双象联合追杀黑王！",
          "highlights": [
            {
              "squares": [
                "e8",
                "d7"
              ],
              "color": "#FFD70066",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "d7",
              "to": "e8",
              "color": "#FFD700DD"
            }
          ]
        },
        {
          "index": 45,
          "move": "Kf8",
          "popup": "⬇️ <b>23...Kf8</b> — 王再次逃跑",
          "highlights": [],
          "concept_arrows": []
        },
        {
          "index": 46,
          "move": "Bxe7#",
          "popup": "⬆️ <b>24.Bxe7# — 将死！🏆✨</b><br>象将死黑王！双象完成了精彩的将杀！<br><span style='color:#FFD700'>★ 这就是「常青树之局」！先献车、再献后，最终双象将杀！</span>",
          "highlights": [
            {
              "squares": [
                "e7",
                "f8"
              ],
              "color": "#FFD700AA",
              "duration_ms": 0
            }
          ],
          "concept_arrows": [
            {
              "from": "e7",
              "to": "f8",
              "color": "#FFD700FF"
            }
          ]
        }
      ]
    },
    "explanation": "【常青树之局 】\r\n阿道夫·安德森 vs 让·迪弗雷斯内，1852年柏林\r\n\r\n这局棋由威廉·斯坦尼茨命名为\"常青树之局\"，\r\n因为它的精彩程度经历了时间的考验，永远保持新鲜。\r\n\r\n【棋局过程】\r\n开局：意大利开局（Giuoco Piano）+ 依文斯弃兵（Evans Gambit变例）\r\n白方b4弃兵换取快速发展，整局一直主动进攻。\r\n\r\n【关键牺牲序列（第20-24步）】\r\n20. Rxe7+! — 白方献出车！\r\n20...Nxe7  — 黑马被迫吃车\r\n21. Qxd7+! — 白方再献出后！这是将杀序列！\r\n21...Kxd7  — 黑王被迫吃后\r\n22. Bf5+ Ke8  — 象将军，王被追\r\n23. Bd7+ Kf8  — 象将军，王继续逃\r\n24. Bxe7#    — 象将死！\r\n\r\n【学习要点】\r\n★ 牺牲大子（车、后）有时能带来将杀\r\n★ 双象配合是极其强大的武器\r\n★ 计算清楚将杀序列前不要轻易弃大子\r\n"
  }
};
