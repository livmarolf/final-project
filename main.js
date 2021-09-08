const MOMENTUM = {
  UP: -1.5, // Rate at which the blocks rise
  DOWN: 3.5, // The fallrate of the player
  LEFT: -2, // Player's left strafe rate
  RIGHT: 2, // Player's right strafe rate
};
  
  const GAME_BORDER = 2;
  
  const BLOCK_HEIGHT = 20;
  const BLOCK_SPACING = 100;
  const HOLE_WIDTH = 40;
  
  const state = {
    gameOver: false,
    score: 0,
    controls: {
      left: 0,
      right: 0,
    },
    board: {
      element: null,
      width: 0,
      height: 0,
    },
    player: {
      element: null,
      size: 0,
      y: 0,
      x: 0,
    },
    blocks: [
      /* 
        {
            blockElement,
            holeElement,
            y,
            holePosition,
            cleared
        }
      */
    ],
  };
  
  const getRandomHolePosition = () =>
    Math.random() * (state.board.width - HOLE_WIDTH);
  
  const getPlayerRectAfterOffset = () => {
    return {
      top: state.player.y + MOMENTUM.DOWN,
      left: state.player.x,
      right: state.player.x + state.player.size,
      bottom: state.player.y + MOMENTUM.DOWN + state.player.size,
    };
  };
  const getHoleRect = (block) => {
    return {
      left: block.holePosition,
      right: block.holePosition + HOLE_WIDTH,
    };
  };
  
  const handleKeyDown = (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
  
    if (e.key === "ArrowLeft") state.controls.left = Date.now();
    else if (e.key === "ArrowRight") state.controls.right = Date.now();
  };
  
  const handleKeyUp = (e) => {
    if (e.key === "ArrowLeft") state.controls.left = 0;
    else if (e.key === "ArrowRight") state.controls.right = 0;
  };
  
  const renderPlayer = () => {
    state.player.element.style.transform = `translate(${state.player.x}px, ${state.player.y}px)`;
  };
  const renderBlock = (block) => {
    block.blockElement.style.transform = `translate(0px, ${block.y}px)`;
    block.holeElement.style.transform = `translate(${block.holePosition}px, ${block.y}px) scale(1.05)`;
  };
  
  const addBlockToBoard = (block) => {
    state.board.element.appendChild(block.blockElement);
    state.board.element.appendChild(block.holeElement);
  
    state.blocks.push(block);
  };
  
  const removeBlockFromBoard = (block, index) => {
    block.blockElement.remove();
    block.holeElement.remove();
    state.blocks.splice(index, 1);
  };
  
  const createBlock = (y, holePosition) => {
    const blockElement = document.createElement("div");
    const holeElement = document.createElement("div");
  
    blockElement.classList.add("block");
    holeElement.classList.add("hole");
  
    return {
      blockElement,
      holeElement,
      y,
      holePosition,
      cleared: false,
    };
  };
  
  const cleanUp = () => {
    alert(`You scored: ${state.score}`);
  
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  
    state.gameOver = false;
    state.score = 0;
    state.controls.left = 0;
    state.controls.right = 0;
  
    for (let i = state.blocks.length - 1; i >= 0; i--) {
      const block = state.blocks[i];
      removeBlockFromBoard(block, i);
    }
  
    init();
  };
  
  const gameLoop = () => {
    if (state.gameOver) return cleanUp();
    // Queue next frame
    requestAnimationFrame(gameLoop);
  
    // Block count managment
    state.blocks.forEach((block, i) => {
      block.y += MOMENTUM.UP;
  
      if (block.y + BLOCK_HEIGHT < 0) {
        removeBlockFromBoard(block, i);
        addBlockToBoard(createBlock(state.board.height, getRandomHolePosition()));
      }
    });
  
    // Strafe movement
    if (state.controls.left || state.controls.right) {
      if (state.controls.left > state.controls.right) {
        state.player.x += MOMENTUM.LEFT;
      } else {
        state.player.x += MOMENTUM.RIGHT;
      }
    }
  
    const playerRect = getPlayerRectAfterOffset();
  
    // The nearest block to the player
    const nearestBlock = state.blocks.reduce(
      (nearest, current) =>
        Math.abs(nearest.y - playerRect.bottom) <
        Math.abs(current.y - playerRect.bottom)
          ? nearest
          : current,
      { y: Infinity }
    );
  
    const holeRect = getHoleRect(nearestBlock);
  
    // Check collision with nearest block
    let colidingWithBlock = false;
    if (playerRect.top < nearestBlock.y && playerRect.bottom >= nearestBlock.y) {
      if (!(playerRect.left > holeRect.left && playerRect.right < holeRect.right))
        colidingWithBlock = true;
      // If not we are coliding with the block vertically,
      // but we're in the hole, make this block as having been cleared.
      else {
        if (!nearestBlock.cleared) {
          nearestBlock.cleared = true;
          state.score++;
        }
      }
    }
  
    // Check collision with edges of hole
    if (nearestBlock.cleared && playerRect.top < nearestBlock.y + BLOCK_HEIGHT) {
      if (playerRect.left < holeRect.left) state.player.x = holeRect.left;
      if (playerRect.right > holeRect.right)
        state.player.x = holeRect.right - state.player.size;
    }
  
    // Calculate player's vertical movement
    if (colidingWithBlock && !nearestBlock.cleared)
      state.player.y = nearestBlock.y - state.player.size;
    else state.player.y += MOMENTUM.DOWN;
  
    // Check collision with the edge of the board
    if (state.player.y + state.player.size > state.board.height)
      state.player.y = state.board.height - state.player.size;
    if (state.player.x + state.player.size > state.board.width)
      state.player.x = state.board.width - state.player.size;
    if (state.player.x < 0) state.player.x = 0;
  
    if (state.player.y < 0) state.gameOver = true;
  
    // Render the state to the screen
    state.blocks.forEach(renderBlock);
    renderPlayer();
  };
  
  const init = () => {
    // init game board
    state.board.element = document.querySelector("#game");
    const gameBoardRect = state.board.element.getBoundingClientRect();
    state.board.width = gameBoardRect.width - GAME_BORDER;
    state.board.height = gameBoardRect.height - GAME_BORDER;
  
    // init player
    state.player.element = document.querySelector("#player");
    state.player.size = state.player.element.getBoundingClientRect().width;
    state.player.x = state.board.width / 2 - state.player.size / 2;
    state.player.y = state.board.height - state.player.size;
  
    // Handle events
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  
    // Set up the initial blocks
    const initialBlockCount = Math.round(
      state.board.height / (BLOCK_HEIGHT + BLOCK_SPACING)
    );
  
    for (let i = 0; i < initialBlockCount; i++) {
      const block = createBlock(
        (i + 1) * (state.board.height / initialBlockCount + BLOCK_HEIGHT / 2),
        getRandomHolePosition()
      );
  
      addBlockToBoard(block);
    }
  
    console.log("state :>> ", state);
  
    // Queue first frame
    requestAnimationFrame(gameLoop);
  };
  
  // wait for the document to fully load before it initializes
  window.addEventListener("DOMContentLoaded", init);
  