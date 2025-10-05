import { CST } from "../CST";

export class Menu extends Phaser.Scene{
    constructor(){
        super({
            key: CST.SCENES.MENU
        })
    }
    onObjectClicked() {

        this.scene.start('LogIn')
    
    }

    create(){

        //this.add.image(this.game.renderer.width /2, this.game.renderer.height * 2, "logo").setDepth(1);
        //this.add.image(this.game.renderer.width /2, this.game.renderer.height * 0.20, "challenge").setDepth(1);
        this.add.image(0,0,"background").setOrigin(0).setDepth(0);
        
        //this.add.image(this.game.renderer.width /2, this.game.renderer.height / 2 + 120, "play").setDepth(1);

       // let playButton2 = this.add.image(this.game.renderer.width /2, this.game.renderer.height / 2 + 100, "story").setDepth(2);
       //let playButton3 = this.add.image(this.game.renderer.width /2, this.game.renderer.height / 2 + 200, "freePlay").setDepth(3);
        //this.add.image(this.game.renderer.width /2, this.game.renderer.height / 2 + 250, "settings").setDepth(1);
        
      
        let playButton1 = this.add.image(this.game.renderer.width /2, this.game.renderer.height /3.5, "Logo").setDepth(1);
        let playButton2 = this.add.image(this.game.renderer.width /1.8, this.game.renderer.height /2, "gameButton").setDepth(1);
        
        
        
        

        playButton1.setInteractive()
        playButton1.on("pointerover", ()=>{
            hoverSprite.setVisible(true);
            hoverSprite.play("walk");
            hoverSprite.x = playButton1.x - playButton1.width;
            hoverSprite.y = playButton.y;
            console.log("Hover")
        })
        /*
        playButton1.on("pointerout", ()=>{
            hoverSprite.setVisible(false);
            console.log("Out")
        })*/

        playButton1.on("pointerup", ()=>{
            console.log("Up")
        })

        playButton1.on("pointerdown", /*this,getFromLoadScene.bind(this),*/ ()=>{
           // window.myScene = this;

            
            
            console.log("Down")


        })
        playButton2.setInteractive();
        this.input.on('gameobjectdown', this.onObjectClicked, this);
        
       
        /*
        getFromChooseLevel(){
            this.scene.get("ChooseLevel").
        }*/
        /*
        playButton2.setInteractive()
        playButton2.on("pointerover", ()=>{
            console.log("Hover")
        })
        playButton2.on("pointerout", ()=>{
            console.log("Out")
        })

        playButton2.on("pointerup", ()=>{
            console.log("Up")
        })
        */

    }
   

    
}
//,this.game.renderer.width /2, this.game.renderer.height * 20,