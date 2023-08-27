const FRAMES_PER_SECOND = 60;

class Example extends Phaser.Scene {
    snake;
    foodPos;
    foodObj;
    cursors;
    gridScale = 50;
    fpsCounter = 0;
    snakeDirection = 'down';
    gridHeight;
    gridWidth;

    displayElement;
    speed = 1;
    snakeParts = [];

    preload() {
        this.load.image('food', 'food.png');

        this.load.image('taildown', 'headTop.png');
        this.load.image('tailup', 'headDown.png');
        this.load.image('tailleft', 'headLeft.png');
        this.load.image('tailright', 'headRight.png');

        this.load.image('headup', 'headTop.png');
        this.load.image('headdown', 'headDown.png');
        this.load.image('headright', 'headLeft.png');
        this.load.image('headleft', 'headRight.png');

        this.load.image('bodyup', 'bodyAbove.png');
        this.load.image('bodydown', 'bodyAbove.png');
        this.load.image('bodyright', 'bodySide.png');
        this.load.image('bodyleft', 'bodySide.png');

    }

    create() {
        this.displayElement = document.getElementById("info");

        const startPos = { x: 2, y: 1 };


        this.snake = this.physics.add.group({
            key: 'headdown',
            repeat: 0,
            setXY: { x: startPos.x * this.gridScale, y: startPos.y * this.gridScale }
        });

        this.snakeParts.push({
            ...startPos, direction: this.snakeDirection
        });

        this.foodPos = { x: 2, y: 2 };
        this.foodObj = this.physics.add.image(this.gridScale * this.foodPos.x, this.gridScale * this.foodPos.y, 'food');

        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.world.setFPS(FRAMES_PER_SECOND);

        this.gridWidth = this.physics.world.bounds.width / this.gridScale;
        this.gridHeight = this.physics.world.bounds.height / this.gridScale;
    }

    updateSnake() {
        const head = this.snakeParts[0];
        let snakeX = head.x;
        let snakeY = head.y;

        if (this.snakeParts.some((part, index) => index != 0 && part.x == head.x && part.y == head.y)) {
            this.gameOver();
            return;
        }

        const previousX = head.x;
        const previousY = head.y;

        if (this.snakeDirection == 'up') snakeY--;
        if (this.snakeDirection == 'down') snakeY++;
        if (this.snakeDirection == 'left') snakeX--;
        if (this.snakeDirection == 'right') snakeX++;

        if (snakeY == 0) { snakeY = this.gridHeight - 1; }
        if (snakeX == 0) { snakeX = this.gridWidth - 1; }
        if (snakeX == this.gridWidth) { snakeX = 1; }
        if (snakeY == this.gridHeight) { snakeY = 1; }

        if (previousX === this.foodPos.x && previousY === this.foodPos.y) {
            this.growSnake(snakeX, snakeY);
            this.moveFood();
        }
        else {
            this.moveTail(snakeX, snakeY, this.snakeDirection);
        }

        this.render();
    }

    moveTail(newPositionX, newPositionY, direction) {
        let nextPosition = { x: newPositionX, y: newPositionY, direction };
        for (const part of this.snakeParts) {
            const oldPos = { ...part };
            part.x = nextPosition.x;
            part.y = nextPosition.y;
            part.direction = nextPosition.direction;
            nextPosition = oldPos;
        }
    }
    render() {
        const currentScore = this.snakeParts.length - 1;
        this.displayElement.innerHTML =
            `Passengers aboard: ${currentScore}<br/>
         Current speed: ${Math.floor(currentScore / 5)}<br/>
         Current Highscore: ${this.getHighScore()}`;
        this.foodObj.x = this.foodPos.x * this.gridScale;
        this.foodObj.y = this.foodPos.y * this.gridScale;

        if (this.snake == undefined) { return; }

        let previousDirection = this.snakeDirection;
        const gameAssets = this.snake.getChildren();
        this.snakeParts.forEach((part, index) => {
            const bodyType = this.getSnakePart(index)
            const asset = `${bodyType}${previousDirection}`;
            previousDirection = part.direction;

            gameAssets[index].x = part.x * this.gridScale;
            gameAssets[index].y = part.y * this.gridScale;
            gameAssets[index].setTexture(asset);
        });
    }

    getSnakePart(index) {
        if (index == 0) { return "head"; }
        if (index === this.snakeParts.length - 1) { return "tail"; }
        return "body"
    }

    update() {
        if (!this.snake) return;

        this.fpsCounter = this.fpsCounter + 1;
        this.speed = Math.max(5, 30 - 5 * (Math.floor((this.snakeParts.length - 1) / 5)));
        if (this.fpsCounter % this.speed == 0) {
            this.updateSnake();
        }
        if (this.cursors.up.isDown) this.snakeDirection = 'up';
        if (this.cursors.down.isDown) this.snakeDirection = 'down';
        if (this.cursors.left.isDown) this.snakeDirection = 'left';
        if (this.cursors.right.isDown) this.snakeDirection = 'right';

    }

    moveFood() {
        const randomX = Phaser.Math.Between(1, this.gridWidth - 1);
        const randomY = Phaser.Math.Between(1, this.gridHeight - 1);
        this.foodPos = { x: randomX, y: randomY };
    }

    growSnake(x, y) {
        const bodyDirection = (this.snakeDirection == 'up' || this.snakeDirection == 'down') ? "snakeBodyAbove" : "snakeBodySide";

        const head = this.snakeParts[0];
        const previousX = head.x;
        const previousY = head.y;
        head.x = x;
        head.y = y;

        this.snake.create(head.x * this.gridScale, this.gridScale * head.y, bodyDirection); // Add a new segment to the Snake

        this.snakeParts = [head, { x: previousX, y: previousY, direction: this.snakeDirection }, ...this.snakeParts.slice(1)];
    }

    gameOver() {
        this.snake = undefined;
        alert(`Game Over${this.snakeParts.length - 1}`);
        this.updateHighScoreIfNecessary(this.snakeParts.length - 1);
        this.render();
    }

    getHighScore() {
        const highScore = parseInt(localStorage.getItem("Highscore"));
        if (highScore == undefined || isNaN(highScore)) {
            return 0;
        }
        return highScore;
    }
    updateHighScoreIfNecessary(newScore) {
        const oldScore = this.getHighScore();
        if (oldScore < newScore) {
            alert("You achieved a new Highscore");
            localStorage.setItem("Highscore", newScore)
        }
    }
}
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    scene: Example,
    fps: {
        target: FRAMES_PER_SECOND,
    },
    physics: {
        default: "arcade",
        arcade: {
            fps: FRAMES_PER_SECOND,
            debug: false,
        }
    }
};

const game = new Phaser.Game(config);