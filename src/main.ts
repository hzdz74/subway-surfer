import './style.css';
import { Game } from './game/Game';
import { UI } from './components/UI';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container');
}

const game = new Game(container);
const ui = new UI(game, container);
ui.attachStateSync();

// Pause when the tab loses focus during a run.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state.value === 'playing') {
    game.pause();
  }
});

// Expose for quick debugging in the console.
(window as unknown as { __game: Game }).__game = game;
