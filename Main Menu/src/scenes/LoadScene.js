import { CST } from "../CST";

export class LoadScene extends Phaser.Scene{
    constructor(){
        super({
            key: CST.SCENES.LOAD
        })
    }
    init(){

    }
    preload(){
        this.load.image("background","./assets/background.png");
        this.load.image("Logo","./assets/Logo.png");
        this.load.image("play","./assets/play.png");
        this.load.image("settings","./assets/settings.png");
        this.load.image("gameButton","./assets/gameButton.png");
        //this.load.image("chooseLevelBG","./assets/chooseLevelBG.png");
        /*
        this.load.spritesheet("cat","./assets/cat.png" , {
            frameHeight: 32,
            frameWidth: 32
            
        });
        */
    
       //this.load.audio("title_music", ".assets/wtv.mp3");

        //create a loading bar

        let loadingBar = this.add.graphics({
            fillStyle: {
                color: 0xffffff
            }
        })
        /*Loader events:
        complete - when done loading everything
        progress - loader number progress in decimal
        */
       //stimulate large load
       
       
        for (let i =0; i<200; i++){
            this.load.spritesheet("cat" + i , "./assets/cats.png" , {
                frameHeight: 32,
                frameWidth: 32
            });
        
            
        }
        
        
        this.load.on("progress", (percent) =>{
            loadingBar.fillRect(0, this.game.renderer.height / 2, this.game.renderer.width * percent, 50);
            console.log(percent);
        })

        this.load.on("complete", ()=>{
            console.log("done");

        })
        }
    
    create(){
        /*
        let bg=this.add.image(0,0, "ra");

        bg.displayHeight=this.sys.game.config.height;
        bg.scaleX=bg.scaleY;

        bg.y=game.config.height/2;
        bg.x=game.config.width/2;
        
        bg.x=bg.displayWidth*.5;
        */
       
        this.scene.start(CST.SCENES.MENU);
       
       /*
       var playButton1 = this.add.image(this.game.renderer.width / 2, this.game.renderer,height / 3, "challenge").setDepth(1);
       var playButton1.setInteractive();
       playButton1.on("pointerdown", function(){
        this,scene.start("chooseLevel")
       }, this);
       */

       //this.sound.play("menu_music",{
        //loop: true
      //  });


    }
    //update(){}
}
