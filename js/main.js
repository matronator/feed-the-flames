Crafty.mobile = true;
Crafty.init();
Crafty.timer.FPS(30); //Sets global frame rate to 20

var minBaseSize = 128, maxBaseSize = 256, _curWidth = 1280, _curHeight = 720, baseSize = 160;
var curWidth, curHeight;
curWidth = 1280;
curHeight = 720;

//Main Menu
Crafty.defineScene("menu", function () {
    Crafty.background("#000000");
    
    var buttonStart = Crafty.e("2D, Canvas, Color, Mouse");
    buttonStart.attr({
        x: 0,
        y: 0,
        w: 128,
        h: 48
    }).color("green");
    
    buttonStart.bind("Click", function (e) {
        Crafty.enterScene("game");
    });

	//instructions
	var infoText = Crafty.e("2D, DOM, Text");
    infoText.attr({ x: 10, y: 132, w: 500 }).text("Start by clicking the green button above. Instructions: Click on the squares in the middle before they run out of mass. The number on the square is its level - higher the level, the more Mass points you get and the square will lose mass slower. You can upgrade squares by clicking the yellow button and then clicking the square you want to upgrade. Upgrading costs Mass points - they are displayed in the left bottom corner - when clicking the yellow button, the text on the squares will show how much Mass points you need to upgrade. You can add new squares by clicking the green button - the cost of new square is displayed on it. The more squares you have, the more Score and Mass points you get. You can pause/unpause the game with the red button.").textFont({ size: "14px" }).textColor("#ffffff");
});

//Game Scene
Crafty.defineScene("game", function () {
    //Dots definition
    var dots = [], dotsInner = [], dotsClicker = [], dotsLevel = [], dotsCount = 0, baseMass = 100, baseLevel = 1, baseUpgCost = 50, baseMassPerClick = 10, baseUpgPow = 2.5, baseNewDotCost = 100, baseDotCost = 100;
    var dotsHor = 0, dotsVer = 0;
    var baseDotY = (curHeight / 2) - baseSize;

    Crafty.background("#000000"); //iPhone 5s landscape: 568x300
    
    //Playing field definition
    var playField = Crafty.e("2D, Canvas, Color, Mouse");
    var scaleBy;
    scaleBy = Math.min(window.innerWidth / _curWidth, window.innerHeight / _curHeight);
    Crafty.viewport.scale(scaleBy);
    playField.attr({
        x: 0,
        y: 0,
        w: curWidth,
        h: curHeight - minBaseSize - 20
    }).color("#444444");
    playField.z = -9;
    
    //Score
    var totalMass = 0, totalScore = 0, growth = 0, upg = false, delayTimeMass = 200, delayTimeScore = 1000;
    
    //Formulas, equations
    function eqUpgCost(eqID) {
        //round((level^baseUpgPow)*(level^(level/10))) * baseUpgCost
        return (Math.round(Math.pow(dots[eqID].level, baseUpgPow) * Math.pow(dots[eqID].level, dots[eqID].level / 10)) * baseUpgCost);
    }
    
    function eqMassInc(eqID) {
        //round(baseMassPerClick * (level^0.5))
        return (Math.round(baseMassPerClick * Math.pow(dots[eqID].level, 0.5)));
    }
    
    function eqNewMaxMass(eqID) {
        //round((level^1.35) * 10) * (baseMass / 10)
        return (Math.round(Math.pow(dots[eqID].level, 1.35) * 10) * (baseMass / 10));
    }
    
    //Create first dot
    createDot(dotsCount, (curWidth / 2) - (baseSize / 2), baseDotY, baseSize, baseLevel, baseMass);
    
    function createDot(dind, xc, yc, size, level, mass) {
        //Main part
        dots[dind] = Crafty.e("2D, Canvas, Color, Mouse");
        dots[dind].attr({
            x: xc,
            y: yc,
            w: size,
            h: size,
            level: level,
            mass: mass,
            d_growth: level,
            max_mass: mass
        }).color("white");
        dots[dind].z = 1;
        
        //Decrease mass
        dots[dind].bind("EnterFrame", function () {
            this.mass = this.mass - 1;
            this.h = (this.mass / this.max_mass) * baseSize;
            
            if (this.mass <= 0) {
                alert("Game Over! Score: " + totalMass);
                Crafty.enterScene("menu");
            }
        });
        
        //Second part
        dotsInner[dind] = Crafty.e("2D, Canvas, Color").attr({
            x: xc,
            y: yc,
            w: size,
            h: size
        });
        dotsInner[dind].z = -1;
        
        //Change color randomly
        if (Math.floor(4 * Math.random()) === 0) {
            dotsInner[dind].color("#55aa55");
        } else if (Math.floor(4 * Math.random()) === 1) {
            dotsInner[dind].color("#407f7f");
        } else if (Math.floor(4 * Math.random()) === 2) {
            dotsInner[dind].color("#d46a6a");
        } else {
            dotsInner[dind].color("#d49a6a");
        }
        
        //Invisible clicking map
        dotsClicker[dind] = Crafty.e("2D, Canvas, Mouse").attr({
            x: xc,
            y: yc,
            w: size,
            h: size
        });
        dotsClicker[dind].z = 9;
        
        dotsClicker[dind].bind("Click", function () {
            if (upg === false) {
                if (totalMass >= 1 && dots[dind].mass <= dots[dind].max_mass - eqMassInc(dind)) {
                    dots[dind].mass = dots[dind].mass + eqMassInc(dind);
                    dots[dind].h = (dots[dind].mass / dots[dind].max_mass) * baseSize;
                    totalMass -= 1;
                }
            } else {
                if (totalMass >= eqUpgCost(dind)) {
                    upgradeDot(dind);
                    resetDotInfo(0);
                    upg = false;
                } else {
                    resetDotInfo(0);
                    upg = false;
                }
            }
        });
        
        //Dot level text overlay
        var textRen = dots[dind].level.toString();
        dotsLevel[dind] = Crafty.e("2D, DOM, Text").unselectable();
        dotsLevel[dind].textFont({ size: "48px", weight: "bold", family: "Helvetica Neue" });
        dotsLevel[dind].text(textRen);
        dotsLevel[dind].attr({ x: dots[dind].x, y: dots[dind].y, w: dots[dind].w });
        dotsLevel[dind].y = dots[dind].y + (baseSize / 2) - 24;
        dotsLevel[dind].textAlign("center");
        dotsLevel[dind].textColor("#000000");
        dotsLevel[dind].z = 8;
        
        //Change growth and number of dots/orientation
        growth += dots[dind].d_growth;
        dotsCount = dotsCount + 1;
        dotsHor += 1;
        
        /*if (dotsHor < 5) {
            dotsHor += 1;
        } else {
            dotsVer += 1;
            dotsHor = 0;
        }*/
    }
    
    //Reset texts on dots
    function resetDotInfo(dif) {
        for (dif = 0; dif < dotsCount; dif = dif + 1) {
            dotsLevel[dif].textFont({ size: "48px", weight: "bold", family: "Helvetica Neue" });
            dotsLevel[dif].y = dots[dif].y + (baseSize / 2) - 24;
            dotsLevel[dif].textColor("#000000");
            dotsLevel[dif].text(dots[dif].level.toString());
        }
    }
    
    //Button for creating dots
    Crafty.sprite("./img/newDotButton.png", {sprNewDot:[0,0,256,256]});
    var dotCreator = Crafty.e("2D, Canvas, Mouse, sprNewDot");
    dotCreator.attr({
        x: 0,
        y: curHeight - minBaseSize - 10,
        w: minBaseSize,
        h: minBaseSize
    });
    
    var dotCreatorInfo = Crafty.e("2D, DOM, Text").unselectable();
    dotCreatorInfo.textFont({ size: "22px" });
    dotCreatorInfo.text(baseNewDotCost.toString());
    dotCreatorInfo.attr({ x: dotCreator.x, y: dotCreator.y, w: dotCreator.w });
    dotCreatorInfo.y = dotCreator.y + (minBaseSize / 2) - 11;
    dotCreatorInfo.textAlign("center");
    dotCreatorInfo.textColor("#ff0000");
    dotCreatorInfo.z = 8;
    
    //Create new dot on click
    dotCreator.bind("Click", function () {
        if (dotsCount < 6 && totalMass >= baseNewDotCost) {
            totalMass -= baseNewDotCost;
            var dcif;
            for (dcif = 0; dcif < dotsCount; dcif = dcif + 1) {
                dots[dcif].x -= (baseSize / 2) + 10;
                dotsInner[dcif].x = dots[dcif].x;
                dotsClicker[dcif].x = dots[dcif].x;
                dotsLevel[dcif].x = dots[dcif].x;
            }
            createDot(dotsCount, dots[dotsCount - 1].x + baseSize + 20, baseDotY, baseSize, baseLevel, baseMass);
            baseNewDotCost = Math.pow(dotsCount, 2) * baseDotCost;
            dotCreatorInfo.text(baseNewDotCost.toString());
        }
    });
    
    //Button for upgrading dots
    Crafty.sprite("./img/upgDotButton.png", {sprUpgDot:[0,0,256,256]});
    var upgrader = Crafty.e("2D, Canvas, sprUpgDot, Mouse");
    upgrader.attr({
        x: curWidth - minBaseSize,
        y: curHeight - minBaseSize - 10,
        w: minBaseSize,
        h: minBaseSize
    });

    upgrader.bind("Click", function () {
        var did;
        if (upg === false) {
            upg = true;
            for (did = 0; did < dotsCount; did = did + 1) {
                dotsLevel[did].textFont({ size: "48px", weight: "bold", family: "Helvetica Neue" });
                dotsLevel[did].y = dots[did].y + (baseSize / 2) - 24;
                dotsLevel[did].textColor("#ff0000");
                dotsLevel[did].text("-" + (eqUpgCost(did)).toString());
            }
        } else if (upg === true) {
            upg = false;
            resetDotInfo(did);
        }
    });
    
    //Upgrade dot
    function upgradeDot(dind) {
        totalMass -= eqUpgCost(dind);
        
        dots[dind].level = dots[dind].level + 1;
        dots[dind].max_mass = eqNewMaxMass(dind);
        dots[dind].mass = dots[dind].max_mass;
        
        growth -= dots[dind].d_growth;
        dots[dind].d_growth = dots[dind].level;
        growth += dots[dind].d_growth;
        
        dotsLevel[dind].text(dots[dind].level.toString());
        
        //Change color randomly
        if (Math.floor(4 * Math.random()) === 0) {
            dotsInner[dind].color("#55aa55");
        } else if (Math.floor(4 * Math.random()) === 1) {
            dotsInner[dind].color("#407f7f");
        } else if (Math.floor(4 * Math.random()) === 2) {
            dotsInner[dind].color("#d46a6a");
        } else {
            dotsInner[dind].color("#d49a6a");
        }
    }
    
    //Pausing
    Crafty.sprite("./img/pauseButton.png", {sprPause:[0,0,256,256]});
    var pauseButton = Crafty.e("2D, Canvas, sprPause, Mouse");
    pauseButton.attr({
        x: (curWidth / 2) - (minBaseSize / 2),
        y: curHeight - minBaseSize - 10,
        w: minBaseSize,
        h: minBaseSize
    });

    //Temporarly
    pauseButton.bind("Click", function () {
        //totalMass += 500;
        Crafty.pause();
    });
    
    //Score and points display
    var totalMassText = Crafty.e("2D, DOM, Text");
    totalMassText.attr({ x: 10, y: playField.h - 80, w: 60 }).text("Mass").textFont({ size: "40px" });
    var totalMassTextVal = Crafty.e("2D, DOM, Text");
    totalMassTextVal.attr({ x: 10, y: playField.h - 40, w: 125 }).text("0").textFont({ size: "40px" });
    
    var scoreText = Crafty.e("2D, DOM, Text");
    scoreText.attr({ x: curWidth - 135, y: playField.h - 80, w: 125 }).text("Points").textFont({ size: "40px" }).textAlign("right");
    var scoreTextVal = Crafty.e("2D, DOM, Text");
    scoreTextVal.attr({ x: curWidth - 135, y: playField.h - 40, w: 125 }).text("0").textFont({ size: "40px" }).textAlign("right");
    
    //Timer
    var massTimer = Crafty.e("Delay");
    massTimer.delay(function () {
        totalMass += growth;
        totalMassTextVal.text(totalMass.toString());
        totalScore += dotsCount / 5;
        scoreTextVal.text(Math.round(totalScore).toString());
    }, delayTimeMass, -1);
    
    //Temporarly cheats
    var cheating = Crafty.e("DOM, Keyboard");
    cheating.bind("KeyUp", function (e) {
        if (e.key === Crafty.keys.UP_ARROW) {
            Crafty.pause();
            var intInc = parseInt(prompt("Increase mass by", "10000"), 10);
            if (!isNaN(intInc)) {
                totalMass += intInc;
            }
            Crafty.pause();
        }
    });
});

Crafty.enterScene("menu");

//Crafty viewport, orientation, gameloop/timer, pausing
window.addEventListener("resize", function(event) {
    var scaleBy;
    scaleBy = Math.min(window.innerWidth / _curWidth, window.innerHeight / _curHeight);
    Crafty.viewport.scale(scaleBy);
});