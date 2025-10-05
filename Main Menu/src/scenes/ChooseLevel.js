class ChooseLevel extends Phaser.Scene{
    constructor(){
        super("ChooseLevel");

    }

    preload(){
        this.preload.image("chooseLevelBG", ".assets/ChooseLevelBG")
    }
    



    create(){
        console.log("Choose level");
     
        
        this.scene.start(CST.SCENES.MENU);

    }
}