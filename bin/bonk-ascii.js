#!/usr/bin/env node
/* Bonk Box, in the terminal.
 *
 * The whole toy is a stickman in a box who gets a prop dropped on him and
 * always gets back up. This is that, in text, for the times you are in a
 * terminal and not looking at a window - which for most people is most of the
 * time. It is a demake of the toy, not a notification.
 *
 * It draws on the ALTERNATE SCREEN, so your scrollback is untouched: when it
 * finishes, everything you had is exactly where you left it and one line is
 * added. Ctrl-C puts the terminal back the way it was found.
 *
 * No dependencies. Nothing is written anywhere. Nothing is sent anywhere from
 * this file - the event POST is the shell script's job, same as always.
 */
'use strict';

const out = process.stdout;
const COLOR = !process.env.NO_COLOR;
const c = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const ink = (s) => c('37', s);
const pencil = (s) => c('90', s);
const marker = (s) => c('31', s);
const shine = (s) => c('33', s);

/* ---- the cast ---------------------------------------------------------- */

/* Standing, mid-air, and the three beats of getting back up. Hand-drawn
   rather than generated: a ragdoll reads as funny only if the poses are
   actually chosen. */
const POSES = {
  stand: [' ( ) ', ' /|\\ ', ' / \\ '],
  brace: [' (o) ', ' \\|/ ', ' / \\ '],
  tumbleA: ['     ', ' (o)/', ' /|  '],
  tumbleB: ['  _  ', ' /o) ', ' |\\  '],
  tumbleC: ['     ', ' \\o) ', '  /| '],
  flat: ['     ', '     ', ' -o- '],
  siftA: ['     ', ' (-) ', ' /|_ '],
  siftB: [' (-) ', ' /|  ', ' / \\ '],
  cheer: [' \\o/ ', '  |  ', ' / \\ '],
  thumb: [' (^) ', ' /|b ', ' / \\ ']
};

/* Classic slapstick only. */
const TOYS = {
  anvil: { art: ['▗▄▄▄▖', '▐███▌', ' ▀▀▀ '], word: 'BONK!' },
  piano: { art: ['┌───┐', '│▓▒▓│', '└───┘'], word: 'PLINK!' },
  firework: { art: ['  ▲  ', ' ███ ', '  ▼  '], word: 'POP!' }
};

const STARS = ['✦', '✧', '·', '✳'];

/* ---- the page ---------------------------------------------------------- */

const W = 30; // inside width of the box
const H = 8; // inside height, with room for the drop to be seen coming

function blank() {
  return Array.from({ length: H }, () => Array(W).fill(' '));
}

function place(grid, art, x, y) {
  art.forEach((row, r) => {
    const gy = y + r;
    if (gy < 0 || gy >= H) return;
    for (let i = 0; i < row.length; i++) {
      const gx = x + i;
      if (gx < 0 || gx >= W) continue;
      if (row[i] !== ' ') grid[gy][gx] = row[i];
    }
  });
}

function render(grid, caption) {
  const top = pencil('  ,' + '-'.repeat(W) + '.');
  const bottom = pencil("  '" + '-'.repeat(W) + "'");
  const floor = pencil('  ' + ' ' + '/'.repeat(W) + ' ');
  const body = grid.map((row) => pencil('  |') + ink(row.join('')) + pencil('|'));
  const cap = caption ? '\n  ' + caption : '';
  return ['', top, ...body, bottom, floor, cap].join('\n');
}

/* ---- the beat sheet ---------------------------------------------------- */

function frames() {
  const names = Object.keys(TOYS);
  const toy = TOYS[names[Math.floor(Math.random() * names.length)]];
  const manX = 12;
  const manY = 5;
  const list = [];

  const push = (fn, caption) => {
    const g = blank();
    fn(g);
    list.push(render(g, caption));
  };

  // He is standing there, minding his own business.
  push((g) => place(g, POSES.stand, manX, manY), pencil('your agent'));
  push((g) => place(g, POSES.stand, manX, manY), pencil('your agent'));

  // Something is on its way down.
  for (let i = 0; i < 4; i++) {
    push((g) => {
      place(g, toy.art, manX, i);
      place(g, i >= 2 ? POSES.brace : POSES.stand, manX, manY);
    }, '');
  }

  // Contact.
  push((g) => {
    place(g, toy.art, manX, manY - 1);
    place(g, POSES.flat, manX, manY);
  }, marker(toy.word));

  // Off he goes.
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.tumbleA, manX + 4, manY - 1);
    place(g, [shine(STARS[0]) + ' ' + shine(STARS[1])], manX + 4, manY - 2);
  }, '');
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.tumbleB, manX + 8, manY - 2);
  }, '');
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.tumbleC, manX + 11, manY);
  }, '');
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.flat, manX + 12, manY + 1);
  }, pencil('...'));

  // Seeing stars, then finding his feet.
  for (let i = 0; i < 2; i++) {
    push((g) => {
      place(g, toy.art, manX, manY + 1);
      place(g, POSES.flat, manX + 12, manY + 1);
      place(g, [STARS[i % 4] + ' ' + STARS[(i + 1) % 4]], manX + 12, manY);
    }, '');
  }
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.siftA, manX + 12, manY);
  }, '');
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.siftB, manX + 12, manY - 1);
  }, '');

  // He is fine. He is always fine.
  push((g) => {
    place(g, toy.art, manX, manY + 1);
    place(g, POSES.cheer, manX + 12, manY);
  }, '');
  for (let i = 0; i < 3; i++) {
    push((g) => {
      place(g, toy.art, manX, manY + 1);
      place(g, POSES.thumb, manX + 12, manY);
    }, pencil("he's fine."));
  }

  return list;
}

/* ---- the terminal ------------------------------------------------------ */

const ALT_ON = '\x1b[?1049h';
const ALT_OFF = '\x1b[?1049l';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';
const HOME = '\x1b[H\x1b[2J';

let restored = false;
function restore() {
  if (restored) return;
  restored = true;
  out.write(SHOW + ALT_OFF);
}

function play() {
  const list = frames();
  out.write(ALT_ON + HIDE);
  // However this ends - finishing, Ctrl-C, a hangup, a crash in here - the
  // terminal goes back the way it was found. Leaving somebody on the alternate
  // screen with no cursor is a genuinely rotten thing to do to a shell.
  process.on('exit', restore);
  process.on('SIGINT', () => {
    restore();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    restore();
    process.exit(143);
  });
  process.on('SIGHUP', () => {
    restore();
    process.exit(129);
  });

  let i = 0;
  const tick = () => {
    if (i >= list.length) {
      restore();
      // One line in the buffer you actually keep.
      out.write('  ' + pencil('bonked.') + '\n');
      return;
    }
    out.write(HOME + list[i] + '\n');
    i++;
    setTimeout(tick, 95);
  };
  tick();
}

/* Piped, redirected, or in CI: three lines and out. `npm test || bonk` should
   look like something in a build log, not like a terminal having a fit. */
function still() {
  const toy = TOYS.anvil;
  process.stdout.write(
    [
      '   ' + toy.art[1] + '      BONK!',
      '    ( ) ',
      '    /|\\   he shipped a bug. he is fine.',
      ''
    ].join('\n')
  );
}

if (out.isTTY) play();
else still();
