// A grid game board plus a tiny coding language, shared by levels 2, 6 and 8.
//
// The language:
//   up()  down()  left()  right()     move one square
//   repeat(3) { ... }                 do the commands inside 3 times (level 3)
//   function hop() { ... }            make a new command called hop (level 8)
//   hop()                             run it
//
// This is a regular script (not a module) so the levels' own scripts can use
// window.CodeBoard right away:
//
//   const compiled = CodeBoard.compile(code);   // { steps, calls } or { error, line }
//   const board = CodeBoard.createBoard(element, { cols: 8, rows: 5 });
//   board.setup({ start, goals, rocks });
//   const result = await board.run(compiled.steps);

(function () {
  const MOVES = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };

  const KEYWORDS = ["repeat", "function"];
  const MAX_STEPS = 300;

  function codeError(message, line) {
    const error = new Error(message);
    error.isCodeError = true;
    error.line = line;
    return error;
  }

  // How many letters you'd change to turn one word into another.
  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    return d[a.length][b.length];
  }

  function suggest(word, known) {
    const best = known
      .map((k) => ({ k, d: distance(word, k) }))
      .sort((a, b) => a.d - b.d)[0];
    const allowed = word.length > 4 ? 2 : 1;
    return best && best.d <= allowed ? best.k : null;
  }

  // ---- Reading the code ----

  function tokenize(code) {
    const tokens = [];
    let line = 1;
    let i = 0;

    while (i < code.length) {
      const ch = code[i];

      if (ch === "\n") { line++; i++; continue; }
      if (/\s/.test(ch) || ch === ";") { i++; continue; }

      // Comments: // like this
      if (code.startsWith("//", i)) {
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }

      if (/[a-z_]/i.test(ch)) {
        let j = i;
        while (j < code.length && /[a-z0-9_]/i.test(code[j])) j++;
        tokens.push({ type: "word", value: code.slice(i, j), line });
        i = j;
        continue;
      }

      if (/\d/.test(ch)) {
        let j = i;
        while (j < code.length && /\d/.test(code[j])) j++;
        tokens.push({ type: "number", value: code.slice(i, j), line });
        i = j;
        continue;
      }

      if ("(){}".includes(ch)) {
        tokens.push({ type: ch, value: ch, line });
        i++;
        continue;
      }

      throw codeError(`Line ${line}: I don't understand the symbol "${ch}".`, line);
    }

    return tokens;
  }

  function parse(code) {
    const tokens = tokenize(code);
    const functions = {};
    let pos = 0;

    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const lastLine = () => (tokens.length ? tokens[tokens.length - 1].line : 1);

    function expect(type, message, line) {
      const token = next();
      if (!token || token.type !== type) {
        const at = token ? token.line : line || lastLine();
        throw codeError(`Line ${at}: ${message}`, at);
      }
      return token;
    }

    function block(what, line) {
      expect("{", `${what} needs a { to start its commands.`, line);
      const body = [];
      while (peek() && peek().type !== "}") {
        const statement = readStatement(false);
        if (statement) body.push(statement);
      }
      if (!peek()) {
        throw codeError(`Line ${line}: ${what} is missing its closing }.`, line);
      }
      next();
      return body;
    }

    function readStatement(topLevel) {
      const token = next();

      if (token.type === "}") {
        throw codeError(`Line ${token.line}: There's an extra }. Does it have a matching {?`, token.line);
      }
      if (token.type !== "word") {
        throw codeError(`Line ${token.line}: Every command starts with a word, like right().`, token.line);
      }

      const word = token.value.toLowerCase();
      const line = token.line;

      // repeat(3) { ... }
      if (word === "repeat") {
        expect("(", "repeat needs a number in ( ), like repeat(3).", line);
        const count = next();
        if (!count || count.type !== "number") {
          throw codeError(`Line ${line}: Put a number inside repeat( ), like repeat(3).`, line);
        }
        expect(")", "Close the parentheses after the number: repeat(3)", line);
        return { type: "repeat", count: Number(count.value), body: block("repeat", line), line };
      }

      // function name() { ... }
      if (word === "function") {
        if (!topLevel) {
          throw codeError(`Line ${line}: Make your function on its own, not inside other { }.`, line);
        }
        const name = next();
        if (!name || name.type !== "word") {
          throw codeError(`Line ${line}: Give your function a name, like function hop().`, line);
        }
        const key = name.value.toLowerCase();
        if (MOVES[key] || KEYWORDS.includes(key)) {
          throw codeError(`Line ${line}: "${name.value}" is already a command. Pick a new name!`, line);
        }
        expect("(", `Put () after the name: function ${name.value}()`, line);
        expect(")", `Put () after the name: function ${name.value}()`, line);
        functions[key] = {
          name: name.value,
          body: block(`function ${name.value}()`, line),
          line,
        };
        return null;
      }

      // A command like right() or hop()
      if (!peek() || peek().type !== "(") {
        throw codeError(`Line ${line}: ${token.value} needs () after it, like ${token.value}().`, line);
      }
      next();
      if (!peek() || peek().type !== ")") {
        throw codeError(`Line ${line}: Close the parentheses: ${token.value}()`, line);
      }
      next();

      if (MOVES[word]) return { type: "move", dir: word, line };
      return { type: "call", name: word, written: token.value, line };
    }

    const program = [];
    while (pos < tokens.length) {
      const statement = readStatement(true);
      if (statement) program.push(statement);
    }

    // Every called command must exist.
    const known = [...Object.keys(MOVES), ...Object.keys(functions)];
    function checkCalls(list) {
      list.forEach((s) => {
        if (s.type === "repeat") checkCalls(s.body);
        if (s.type === "call" && !functions[s.name]) {
          const guess = suggest(s.name, known);
          throw codeError(
            `Line ${s.line}: I don't know the command "${s.written}()".` +
              (guess ? ` Did you mean ${guess}()?` : ""),
            s.line,
          );
        }
      });
    }
    checkCalls(program);
    Object.values(functions).forEach((f) => checkCalls(f.body));

    return { program, functions };
  }

  // Turn the program into a flat list of moves, running loops and functions.
  function expand(parsed) {
    const steps = [];
    let calls = 0;

    function run(list, depth) {
      for (const s of list) {
        if (steps.length > MAX_STEPS) {
          throw codeError(`Your program has way too many steps! Try smaller numbers.`, s.line);
        }
        if (s.type === "move") {
          steps.push(s);
        } else if (s.type === "repeat") {
          for (let i = 0; i < s.count; i++) run(s.body, depth);
        } else if (s.type === "call") {
          if (depth > 20) {
            throw codeError(`Line ${s.line}: ${s.written}() keeps calling itself forever!`, s.line);
          }
          calls++;
          run(parsed.functions[s.name].body, depth + 1);
        }
      }
    }

    run(parsed.program, 0);
    return { steps, calls };
  }

  // Returns { steps, calls, functions } or { error, line }.
  function compile(code) {
    try {
      const parsed = parse(code);
      const { steps, calls } = expand(parsed);
      return { steps, calls, functions: parsed.functions };
    } catch (error) {
      if (error.isCodeError) return { error: error.message, line: error.line };
      throw error;
    }
  }

  // ---- The board ----

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function createBoard(container, options = {}) {
    const cols = options.cols || 8;
    const rows = options.rows || 5;
    const cellSize = options.cellSize || 60;

    container.classList.add("code-board");
    container.style.width = `${cols * cellSize}px`;
    container.style.height = `${rows * cellSize}px`;
    container.style.backgroundSize = `${cellSize}px ${cellSize}px`;

    // The equipped character is drawn into this by js/character.js.
    const player = document.createElement("div");
    player.className = "board-player";
    player.dataset.character = String(cellSize - 6);
    player.style.width = `${cellSize}px`;
    player.style.height = `${cellSize}px`;
    container.appendChild(player);

    let level = null;
    let state = null;

    function place(el, x, y) {
      el.style.left = `${x * cellSize}px`;
      el.style.top = `${y * cellSize}px`;
    }

    function addItem(spot, emoji) {
      const item = document.createElement("div");
      item.className = "board-item";
      item.textContent = emoji;
      item.style.width = `${cellSize}px`;
      item.style.height = `${cellSize}px`;
      item.style.fontSize = `${Math.round(cellSize * 0.65)}px`;
      place(item, spot.x, spot.y);
      container.appendChild(item);
      return item;
    }

    function setup(newLevel) {
      level = newLevel;
      container.querySelectorAll(".board-item").forEach((item) => item.remove());

      (level.rocks || []).forEach((rock) => addItem(rock, "🪨"));

      state = {
        x: level.start.x,
        y: level.start.y,
        goalsLeft: (level.goals || []).map((goal) => ({
          ...goal,
          element: addItem(goal, goal.emoji),
        })),
      };

      player.classList.remove("bonk");
      place(player, state.x, state.y);
    }

    function isRock(x, y) {
      return (level.rocks || []).some((r) => r.x === x && r.y === y);
    }

    // Plays the steps one at a time. Resolves with:
    //   { ok: true, goalsLeft }               finished every step
    //   { ok: false, message, line }          walked into a rock or off the board
    async function run(steps, runOptions = {}) {
      const delay = runOptions.delay || 350;
      setup(level);
      await sleep(150);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (runOptions.onStep) runOptions.onStep(step, i);

        const [dx, dy] = MOVES[step.dir];
        const nx = state.x + dx;
        const ny = state.y + dy;

        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
          player.classList.add("bonk");
          return { ok: false, line: step.line, message: `Line ${step.line}: ${step.dir}() would walk off the edge of the board!` };
        }
        if (isRock(nx, ny)) {
          player.classList.add("bonk");
          return { ok: false, line: step.line, message: `Bonk! Line ${step.line}: ${step.dir}() walked into a rock.` };
        }

        state.x = nx;
        state.y = ny;
        place(player, nx, ny);

        const reached = state.goalsLeft.find((g) => g.x === nx && g.y === ny);
        if (reached) {
          reached.element.classList.add("collected");
          state.goalsLeft = state.goalsLeft.filter((g) => g !== reached);
        }

        await sleep(delay);
      }

      return { ok: true, goalsLeft: state.goalsLeft.length };
    }

    return { setup, run, reset: () => setup(level) };
  }

  window.CodeBoard = { compile, createBoard };
})();
