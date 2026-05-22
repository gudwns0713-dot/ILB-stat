import { useEffect, useMemo, useState } from 'react';

const createId = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createGame = (id, name = `새 경기 ${id}`) => ({
  id,
  opponent: name,
  date: new Date().toISOString().slice(0, 10),
  inning: 1,
  half: '초',
  currentBatter: '',
  balls: 0,
  strikes: 0,
  pitchLog: [],
  logs: [],
  hitters: [],
  pitchers: [],
});

const createHitter = (name = '') => ({
  id: createId(),
  name,
  pa: 0,
  ab: 0,
  h: 0,
  double: 0,
  triple: 0,
  hr: 0,
  bb: 0,
  hbp: 0,
  error: 0,
  fc: 0,
  pitches: 0,
  so: 0,
});

const createPitcher = (name = '') => ({
  id: createId(),
  name,
  outs: 0,
  so: 0,
  hits: 0,
  walks: 0,
  hbp: 0,
  runs: 0,
});

const RESULT_IMPACTS = {
  안타: { ab: 1, h: 1 },
  '2루타': { ab: 1, h: 1, double: 1 },
  '3루타': { ab: 1, h: 1, triple: 1 },
  홈런: { ab: 1, h: 1, hr: 1 },
  삼진: { ab: 1, so: 1 },
  볼넷: { bb: 1 },
  사구: { hbp: 1 },
  실책: { ab: 1, error: 1 },
  야수선택: { ab: 1, fc: 1 },
  병살: { ab: 1, so: 1 },
  땅볼: { ab: 1 },
  뜬공: { ab: 1 },
};

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clone(obj) {
  return { ...obj };
}

function applyHitterImpact(hitter, result, pitchCount, sign = 1) {
  const next = clone(hitter);
  const impact = RESULT_IMPACTS[result] || {};

  next.pa += sign;
  next.pitches += sign * (pitchCount + 1);

  Object.entries(impact).forEach(([key, value]) => {
    next[key] += sign * value;
  });

  return next;
}

function formatOuts(outs) {
  const whole = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${whole}.${rem}`;
}

function calcERA(p) {
  const innings = p.outs / 3;

  if (innings === 0) return '0.00';

  return ((p.runs * 9) / innings).toFixed(2);
}

function calcHitter(h) {
  const pa = toNum(h.pa);
  const ab = toNum(h.ab);
  const hits = toNum(h.h);
  const doubles = toNum(h.double);
  const triples = toNum(h.triple);
  const hr = toNum(h.hr);
  const bb = toNum(h.bb);
  const hbp = toNum(h.hbp);

  const singles = Math.max(
    0,
    hits - doubles - triples - hr
  );

  const avg = ab ? hits / ab : 0;
  const obp = pa ? (hits + bb + hbp) / pa : 0;
  const slg = ab
    ? (singles + doubles * 2 + triples * 3 + hr * 4) /
      ab
    : 0;

  const ops = obp + slg;
  const ppa = pa ? toNum(h.pitches) / pa : 0;

  return {
    avg: avg.toFixed(3),
    obp: obp.toFixed(3),
    slg: slg.toFixed(3),
    ops: ops.toFixed(3),
    ppa: ppa.toFixed(2),
  };
}

export default function BaseballRecordManager() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem(
      'baseball-manager-games'
    );

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          return parsed;
        }
      } catch {}
    }

    return [createGame(1)];
  });

  const [selectedGameId, setSelectedGameId] =
    useState(() => games[0]?.id ?? 1);

  const [mainTab, setMainTab] =
    useState('games');

  const [gameViewTab, setGameViewTab] =
    useState('record');

  useEffect(() => {
    localStorage.setItem(
      'baseball-manager-games',
      JSON.stringify(games)
    );
  }, [games]);

  const selectedGame =
    games.find((g) => g.id === selectedGameId) ||
    games[0];

  const updateSelectedGame = (updater) => {
    setGames((prev) =>
      prev.map((g) =>
        g.id === selectedGameId
          ? updater(g)
          : g
      )
    );
  };

  const addGame = () => {
    const id = createId();

    setGames((prev) => [
      ...prev,
      createGame(
        id,
        `새 경기 ${prev.length + 1}`
      ),
    ]);

    setSelectedGameId(id);
  };

  const deleteGame = (id) => {
    const filtered = games.filter(
      (g) => g.id !== id
    );

    if (filtered.length === 0) {
      const reset = createGame(1);

      setGames([reset]);
      setSelectedGameId(reset.id);
      return;
    }

    setGames(filtered);
    setSelectedGameId(filtered[0].id);
  };

  const updateGameField = (
    field,
    value
  ) => {
    updateSelectedGame((g) => ({
      ...g,
      [field]: value,
    }));
  };

  const addHitter = () => {
    updateSelectedGame((g) => ({
      ...g,
      hitters: [
        ...g.hitters,
        createHitter(
          `타자 ${g.hitters.length + 1}`
        ),
      ],
    }));
  };

  const addPitcher = () => {
    updateSelectedGame((g) => ({
      ...g,
      pitchers: [
        ...g.pitchers,
        createPitcher(
          `투수 ${g.pitchers.length + 1}`
        ),
      ],
    }));
  };

  const deleteHitter = (index) => {
    updateSelectedGame((g) => ({
      ...g,
      hitters: g.hitters.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const deletePitcher = (index) => {
    updateSelectedGame((g) => ({
      ...g,
      pitchers: g.pitchers.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateHitterName = (
    index,
    name
  ) => {
    updateSelectedGame((g) => ({
      ...g,
      hitters: g.hitters.map((h, i) =>
        i === index
          ? { ...h, name }
          : h
      ),
    }));
  };

  const updatePitcherField = (
    index,
    field,
    value
  ) => {
    updateSelectedGame((g) => ({
      ...g,
      pitchers: g.pitchers.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]:
                field === 'name'
                  ? value
                  : toNum(value),
            }
          : p
      ),
    }));
  };

  const updatePitchCount = (type) => {
    updateSelectedGame((g) => {
      let balls = g.balls;
      let strikes = g.strikes;

      const pitchLog = [...g.pitchLog];

      if (type === 'ball') {
        balls += 1;
        pitchLog.push('B');
      }

      if (type === 'strike') {
        strikes += 1;
        pitchLog.push('S');
      }

      if (type === 'foul') {
        if (strikes < 2) strikes += 1;
        pitchLog.push('F');
      }

      return {
        ...g,
        balls,
        strikes,
        pitchLog,
      };
    });
  };

  const addResult = (result) => {
    if (
      !selectedGame?.currentBatter?.trim()
    )
      return;

    updateSelectedGame((g) => {
      const batterName =
        g.currentBatter.trim();

      let hitters = [...g.hitters];

      let hitterIndex =
        hitters.findIndex(
          (h) => h.name === batterName
        );

      if (hitterIndex === -1) {
        hitters.push(
          createHitter(batterName)
        );

        hitterIndex =
          hitters.length - 1;
      }

      const pitchCount =
        g.pitchLog.length;

      hitters[hitterIndex] =
        applyHitterImpact(
          hitters[hitterIndex],
          result,
          pitchCount,
          1
        );

      const logs = [
        ...g.logs,
        {
          id: createId(),
          inning: g.inning,
          half: g.half,
          batter: batterName,
          result,
          pitches: [
            ...g.pitchLog,
            '타격',
          ],
        },
      ];

      return {
        ...g,
        hitters,
        logs,
        balls: 0,
        strikes: 0,
        pitchLog: [],
        currentBatter: '',
      };
    });
  };

 const deleteLog = (index) => {
  updateSelectedGame((g) => {
    const log = g.logs[index];

    if (!log) return g;

    let hitters = [...g.hitters];

    const hitterIndex = hitters.findIndex(
      (h) => h.name === log.batter
    );

    if (hitterIndex !== -1) {
      hitters[hitterIndex] = applyHitterImpact(
        hitters[hitterIndex],
        log.result,
        (log.pitches?.length || 1) - 1,
        -1
      );

      const h = hitters[hitterIndex];

      const totalStats =
        h.pa +
        h.ab +
        h.h +
        h.hr +
        h.bb +
        h.so;

      if (totalStats <= 0) {
        hitters.splice(hitterIndex, 1);
      }
    }

    return {
      ...g,
      hitters,
      logs: g.logs.filter((_, i) => i !== index),
    };
  });
};

  const totalHitters = useMemo(() => {
    const map = {};

    games.forEach((g) => {
      g.hitters.forEach((h) => {
        if (!map[h.name]) {
          map[h.name] = {
            ...h,
          };
        } else {
          Object.keys(h).forEach((key) => {
            if (key !== 'id' && key !== 'name') {
              map[h.name][key] +=
                toNum(h[key]);
            }
          });
        }
      });
    });

    return Object.values(map).map(
      (h) => ({
        ...h,
        ...calcHitter(h),
      })
    );
  }, [games]);

  const totalPitchers = useMemo(() => {
    const map = {};

    games.forEach((g) => {
      g.pitchers.forEach((p) => {
        if (!map[p.name]) {
          map[p.name] = {
            ...p,
          };
        } else {
          map[p.name].outs += p.outs;
          map[p.name].so += p.so;
          map[p.name].hits += p.hits;
          map[p.name].walks += p.walks;
          map[p.name].hbp += p.hbp;
          map[p.name].runs += p.runs;
        }
      });
    });

    return Object.values(map);
  }, [games]);

  const selectedGameHitters =
    selectedGame?.hitters || [];

  const selectedGamePitchers =
    selectedGame?.pitchers || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex justify-between items-center">
          <h1 className="text-5xl font-black">
            ILB STATS
          </h1>

          <button
            onClick={addGame}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-bold"
          >
            경기 추가
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              setMainTab('games')
            }
            className={`px-5 py-3 rounded-2xl font-bold ${
              mainTab === 'games'
                ? 'bg-green-600'
                : 'bg-zinc-800'
            }`}
          >
            경기 기록
          </button>

          <button
            onClick={() =>
              setMainTab('totals')
            }
            className={`px-5 py-3 rounded-2xl font-bold ${
              mainTab === 'totals'
                ? 'bg-green-600'
                : 'bg-zinc-800'
            }`}
          >
            통산 기록
          </button>
        </div>

        {mainTab === 'games' && (
          <>
            <div className="flex gap-3 flex-wrap">
              {games.map((g) => (
                <div
                  key={g.id}
                  className="flex gap-2"
                >
                  <button
                    onClick={() =>
                      setSelectedGameId(g.id)
                    }
                    className={`px-5 py-3 rounded-2xl font-semibold ${
                      selectedGameId === g.id
                        ? 'bg-blue-600'
                        : 'bg-zinc-800'
                    }`}
                  >
                    {g.opponent}
                  </button>

                  <button
                    onClick={() =>
                      deleteGame(g.id)
                    }
                    className="bg-red-600 px-3 py-2 rounded-xl font-bold"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setGameViewTab('record')
                }
                className={`px-5 py-3 rounded-2xl font-bold ${
                  gameViewTab === 'record'
                    ? 'bg-purple-600'
                    : 'bg-zinc-800'
                }`}
              >
                기록지
              </button>

              <button
                onClick={() =>
                  setGameViewTab('stats')
                }
                className={`px-5 py-3 rounded-2xl font-bold ${
                  gameViewTab === 'stats'
                    ? 'bg-purple-600'
                    : 'bg-zinc-800'
                }`}
              >
                개인 기록
              </button>
            </div>

            {gameViewTab === 'record' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={
                        selectedGame.opponent
                      }
                      onChange={(e) =>
                        updateGameField(
                          'opponent',
                          e.target.value
                        )
                      }
                      className="bg-zinc-800 rounded-2xl px-4 py-3 outline-none"
                    />

                    <input
                      type="date"
                      value={
                        selectedGame.date
                      }
                      onChange={(e) =>
                        updateGameField(
                          'date',
                          e.target.value
                        )
                      }
                      className="bg-zinc-800 rounded-2xl px-4 py-3 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    <button
                      onClick={() =>
                        updateGameField(
                          'inning',
                          Math.max(
                            1,
                            selectedGame.inning -
                              1
                          )
                        )
                      }
                      className="bg-zinc-800 px-4 py-3 rounded-2xl"
                    >
                      -
                    </button>

                    <div className="bg-black px-6 py-3 rounded-2xl text-2xl font-bold">
                      {selectedGame.inning}회{' '}
                      {selectedGame.half}
                    </div>

                    <button
                      onClick={() =>
                        updateGameField(
                          'inning',
                          selectedGame.inning +
                            1
                        )
                      }
                      className="bg-zinc-800 px-4 py-3 rounded-2xl"
                    >
                      +
                    </button>

                    <button
                      onClick={() =>
                        updateGameField(
                          'half',
                          selectedGame.half ===
                            '초'
                            ? '말'
                            : '초'
                        )
                      }
                      className="bg-zinc-800 px-4 py-3 rounded-2xl"
                    >
                      초/말
                    </button>
                  </div>

                  <input
                    value={
                      selectedGame.currentBatter
                    }
                    onChange={(e) =>
                      updateGameField(
                        'currentBatter',
                        e.target.value
                      )
                    }
                    placeholder="현재 타자"
                    className="bg-zinc-800 rounded-2xl px-4 py-3 outline-none"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        updatePitchCount(
                          'ball'
                        )
                      }
                      className="bg-green-600 px-5 py-3 rounded-2xl font-bold"
                    >
                      B {selectedGame.balls}
                    </button>

                    <button
                      onClick={() =>
                        updatePitchCount(
                          'strike'
                        )
                      }
                      className="bg-red-600 px-5 py-3 rounded-2xl font-bold"
                    >
                      S{' '}
                      {
                        selectedGame.strikes
                      }
                    </button>

                    <button
                      onClick={() =>
                        updatePitchCount(
                          'foul'
                        )
                      }
                      className="bg-yellow-400 text-black px-5 py-3 rounded-2xl font-bold"
                    >
                      F
                    </button>
                  </div>

                  <div className="bg-black rounded-2xl px-4 py-4 font-mono text-xl min-h-[70px]">
                    {selectedGame.pitchLog.join(
                      ' '
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      '안타',
                      '2루타',
                      '3루타',
                      '홈런',
                      '삼진',
                      '볼넷',
                      '사구',
                      '실책',
                      '야수선택',
                      '병살',
                      '땅볼',
                      '뜬공',
                    ].map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          addResult(r)
                        }
                        className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-2xl"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    타석 로그
                  </h2>

                  <div className="space-y-3 max-h-[800px] overflow-auto">
                    {selectedGame.logs.map(
                      (log, i) => (
                        <div
                          key={log.id}
                          className="bg-zinc-800 rounded-2xl p-4"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              {log.inning}회{' '}
                              {log.half} ·{' '}
                              {log.batter}
                            </div>

                            <button
                              onClick={() =>
                                deleteLog(i)
                              }
                              className="bg-red-600 px-3 py-1 rounded-xl text-sm"
                            >
                              삭제
                            </button>
                          </div>

                          <div className="text-zinc-400 mt-2">
                            {log.pitches.join(
                              ' '
                            )}
                          </div>

                          <div className="text-green-400 mt-2 font-bold">
                            {log.result}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {gameViewTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-zinc-900 rounded-3xl p-4 overflow-x-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                      경기별 타자 기록
                    </h2>

                    <button
                      onClick={addHitter}
                      className="bg-blue-600 px-4 py-2 rounded-xl font-bold"
                    >
                      타자 추가
                    </button>
                  </div>

                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr className="border-b border-zinc-700 text-zinc-400">
                        <th>이름</th>
                        <th>타석</th>
                        <th>타수</th>
                        <th>안타</th>
                        <th>홈런</th>
                        <th>볼넷</th>
                        <th>삼진</th>
                        <th>타율</th>
                        <th>출루율</th>
                        <th>OPS</th>
                        <th>P/PA</th>
                        <th>삭제</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedGameHitters.map(
                        (h, i) => {
                          const s =
                            calcHitter(h);

                          return (
                            <tr
                              key={h.id}
                              className="border-b border-zinc-800"
                            >
                              <td>
                                <input
                                  value={
                                    h.name
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateHitterName(
                                      i,
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-28 bg-zinc-700 px-2 py-1 rounded-lg text-center"
                                />
                              </td>

                              <td>
                                {h.pa}
                              </td>
                              <td>
                                {h.ab}
                              </td>
                              <td>
                                {h.h}
                              </td>
                              <td>
                                {h.hr}
                              </td>
                              <td>
                                {h.bb}
                              </td>
                              <td>
                                {h.so}
                              </td>
                              <td>
                                {s.avg}
                              </td>
                              <td>
                                {s.obp}
                              </td>
                              <td>
                                {s.ops}
                              </td>
                              <td>
                                {s.ppa}
                              </td>

                              <td>
                                <button
                                  onClick={() =>
                                    deleteHitter(
                                      i
                                    )
                                  }
                                  className="bg-red-600 px-2 py-1 rounded-lg text-xs font-bold"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-4 overflow-x-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                      경기별 투수 기록
                    </h2>

                    <button
                      onClick={addPitcher}
                      className="bg-blue-600 px-4 py-2 rounded-xl font-bold"
                    >
                      투수 추가
                    </button>
                  </div>

                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr className="border-b border-zinc-700 text-zinc-400">
                        <th>이름</th>
                        <th>이닝</th>
                        <th>삼진</th>
                        <th>피안타</th>
                        <th>볼넷</th>
                        <th>사구</th>
                        <th>실점</th>
                        <th>ERA</th>
                        <th>삭제</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedGamePitchers.map(
                        (p, i) => (
                          <tr
                            key={p.id}
                            className="border-b border-zinc-800"
                          >
                            <td>
                              <input
                                value={
                                  p.name
                                }
                                onChange={(
                                  e
                                ) =>
                                  updatePitcherField(
                                    i,
                                    'name',
                                    e.target
                                      .value
                                  )
                                }
                                className="w-28 bg-zinc-700 px-2 py-1 rounded-lg text-center"
                              />
                            </td>

                            <td>
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() =>
                                    updatePitcherField(
                                      i,
                                      'outs',
                                      Math.max(
                                        0,
                                        p.outs -
                                          1
                                      )
                                    )
                                  }
                                  className="bg-zinc-700 px-2 py-1 rounded-lg"
                                >
                                  -
                                </button>

                                <span>
                                  {formatOuts(
                                    p.outs
                                  )}
                                </span>

                                <button
                                  onClick={() =>
                                    updatePitcherField(
                                      i,
                                      'outs',
                                      p.outs +
                                        1
                                    )
                                  }
                                  className="bg-zinc-700 px-2 py-1 rounded-lg"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {[
                              'so',
                              'hits',
                              'walks',
                              'hbp',
                              'runs',
                            ].map((f) => (
                              <td key={f}>
                                <input
                                  type="number"
                                  value={
                                    p[f]
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updatePitcherField(
                                      i,
                                      f,
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-20 bg-zinc-700 px-2 py-1 rounded-lg text-center"
                                />
                              </td>
                            ))}

                            <td>
                              {calcERA(
                                p
                              )}
                            </td>

                            <td>
                              <button
                                onClick={() =>
                                  deletePitcher(
                                    i
                                  )
                                }
                                className="bg-red-600 px-2 py-1 rounded-lg text-xs font-bold"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {mainTab === 'totals' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-3xl p-4 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">
                통산 타자 기록
              </h2>

              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400">
                    <th>이름</th>
                    <th>타석</th>
                    <th>안타</th>
                    <th>홈런</th>
                    <th>타율</th>
                    <th>출루율</th>
                    <th>OPS</th>
                    <th>P/PA</th>
                  </tr>
                </thead>

                <tbody>
                  {totalHitters.map((h) => (
                    <tr
                      key={h.name}
                      className="border-b border-zinc-800"
                    >
                      <td>{h.name}</td>
                      <td>{h.pa}</td>
                      <td>{h.h}</td>
                      <td>{h.hr}</td>
                      <td>{h.avg}</td>
                      <td>{h.obp}</td>
                      <td>{h.ops}</td>
                      <td>{h.ppa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-4 overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4">
                통산 투수 기록
              </h2>

              <table className="w-full text-sm text-center">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400">
                    <th>이름</th>
                    <th>이닝</th>
                    <th>삼진</th>
                    <th>피안타</th>
                    <th>볼넷</th>
                    <th>사구</th>
                    <th>실점</th>
                    <th>ERA</th>
                  </tr>
                </thead>

                <tbody>
                  {totalPitchers.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-zinc-800"
                    >
                      <td>{p.name}</td>
                      <td>
                        {formatOuts(
                          p.outs
                        )}
                      </td>
                      <td>{p.so}</td>
                      <td>{p.hits}</td>
                      <td>{p.walks}</td>
                      <td>{p.hbp}</td>
                      <td>{p.runs}</td>
                      <td>
                        {calcERA(p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}